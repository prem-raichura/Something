import { Router } from "express";
import prisma from "../../shared/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { oauthClientFor } from "../../shared/google/oauthClient";
import {
  extractSpreadsheetId,
  validateAndSnapshot,
  fetchScoped,
  fetchRange,
  buildRange,
  listTabs,
} from "../../shared/google/sheets";
import { listSpreadsheets } from "../../shared/google/drive";
import { hashGrid } from "../../shared/google/diff";
import { pollQueue } from "../../shared/queues";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const sheets = await prisma.sheet.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, name: true, color: true } } },
  });
  res.json(sheets);
});

router.get("/available", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const auth = oauthClientFor(user);
    const [files, tracked] = await Promise.all([
      listSpreadsheets(auth),
      prisma.sheet.findMany({
        where: { userId },
        select: { id: true, spreadsheetId: true },
      }),
    ]);

    const trackedMap = new Map(tracked.map((s) => [s.spreadsheetId, s.id]));

    const result = files.map((f) => ({
      spreadsheetId: f.spreadsheetId,
      name: f.name,
      ownedByMe: f.ownedByMe,
      modifiedTime: f.modifiedTime,
      tracked: trackedMap.has(f.spreadsheetId),
      sheetId: trackedMap.get(f.spreadsheetId) ?? null,
    }));

    res.json(result);
  } catch (err: any) {
    const status = err?.code ?? err?.status ?? err?.response?.status;
    if (status === 401 || status === 403) {
      res.status(403).json({ error: "Drive access not granted — sign out and sign in again." });
      return;
    }
    console.error("List available error:", err);
    res.status(500).json({ error: "Failed to list your sheets" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const { url, spreadsheetId: bodyId, projectId } = req.body as {
    url?: string;
    spreadsheetId?: string;
    projectId?: string;
  };

  if (!url && !bodyId) {
    res.status(400).json({ error: "url or spreadsheetId required" });
    return;
  }

  try {
    const spreadsheetId = bodyId ?? extractSpreadsheetId(url!);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const auth = oauthClientFor(user);
    const { label, rows } = await validateAndSnapshot(spreadsheetId, "A1:Z1000", auth);

    // Inherit notification defaults from the project, if one is assigned.
    let notifyEmail = true;
    let notifyPush = true;
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { notifyEmail: true, notifyPush: true },
      });
      if (project) {
        notifyEmail = project.notifyEmail;
        notifyPush = project.notifyPush;
      }
    }

    const sheet = await prisma.sheet.create({
      data: {
        userId,
        spreadsheetId,
        label,
        ...(projectId && { projectId }),
        notifyEmail,
        notifyPush,
        lastHash: hashGrid(rows),
        lastSnapshot: rows,
        lastCheckedAt: new Date(),
      },
    });

    await pollQueue.upsertJobScheduler(
      `poll:${sheet.id}`,
      { every: sheet.pollInterval * 1000 },
      { name: "poll", data: { sheetId: sheet.id } }
    );

    res.status(201).json(sheet);
  } catch (err: any) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "Sheet already tracked" });
      return;
    }
    if (err.message === "Not a valid Google Sheets URL") {
      res.status(400).json({ error: err.message });
      return;
    }
    const status = err.code ?? err.status ?? err?.response?.status;
    if (status === 403) {
      res.status(403).json({ error: "No access to this sheet" });
      return;
    }
    if (status === 404) {
      res.status(404).json({ error: "Sheet not found" });
      return;
    }
    console.error("Add sheet error:", err);
    res.status(500).json({ error: "Failed to add sheet" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const body = req.body as {
    notifyEmail?: boolean;
    notifyPush?: boolean;
    paused?: boolean;
    label?: string;
    projectId?: string | null;
    tab?: string | null;
    range?: string;
    watchMode?: string;
    matchColumn?: string | null;
    matchValue?: string | null;
    pollInterval?: number;
  };

  try {
    const existing = await prisma.sheet.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!existing) {
      res.status(404).json({ error: "Sheet not found" });
      return;
    }

    const scopeChanged =
      (body.tab !== undefined && body.tab !== existing.tab) ||
      (body.range !== undefined && body.range !== existing.range) ||
      (body.watchMode !== undefined && body.watchMode !== existing.watchMode) ||
      (body.matchColumn !== undefined && body.matchColumn !== existing.matchColumn) ||
      (body.matchValue !== undefined && body.matchValue !== existing.matchValue);

    const data: Record<string, unknown> = {
      ...(body.notifyEmail !== undefined && { notifyEmail: body.notifyEmail }),
      ...(body.notifyPush !== undefined && { notifyPush: body.notifyPush }),
      ...(body.paused !== undefined && { paused: body.paused }),
      ...(body.label !== undefined && { label: body.label.trim() || existing.label }),
      ...(body.projectId !== undefined && { projectId: body.projectId }),
      ...(body.tab !== undefined && { tab: body.tab }),
      ...(body.range !== undefined && { range: body.range.trim() || "A1:Z1000" }),
      ...(body.watchMode !== undefined && { watchMode: body.watchMode }),
      ...(body.matchColumn !== undefined && { matchColumn: body.matchColumn }),
      ...(body.matchValue !== undefined && { matchValue: body.matchValue }),
      ...(body.pollInterval !== undefined && { pollInterval: body.pollInterval }),
    };

    // Re-baseline against the new scope so the next poll doesn't fire spuriously.
    if (scopeChanged) {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      const auth = oauthClientFor(user);
      const merged = { ...existing, ...data } as typeof existing;
      const rows = await fetchScoped(
        {
          spreadsheetId: merged.spreadsheetId,
          tab: merged.tab,
          range: merged.range,
          watchMode: merged.watchMode,
          matchColumn: merged.matchColumn,
          matchValue: merged.matchValue,
        },
        auth
      );
      data.lastHash = hashGrid(rows);
      data.lastSnapshot = rows;
      data.lastCheckedAt = new Date();
      data.errorMessage = null;
    }

    const sheet = await prisma.sheet.update({
      where: { id: req.params.id, userId },
      data,
      include: { project: { select: { id: true, name: true, color: true } } },
    });

    // Pause/resume: drop or (re)create the repeatable poll job.
    if (body.paused !== undefined && body.paused !== existing.paused) {
      if (body.paused) {
        await pollQueue.removeJobScheduler(`poll:${sheet.id}`).catch(() => {});
      } else {
        await pollQueue.upsertJobScheduler(
          `poll:${sheet.id}`,
          { every: sheet.pollInterval * 1000 },
          { name: "poll", data: { sheetId: sheet.id } }
        );
      }
    } else if (
      !sheet.paused &&
      body.pollInterval !== undefined &&
      body.pollInterval !== existing.pollInterval
    ) {
      // Reschedule the poll job if the interval changed (and not paused).
      await pollQueue.upsertJobScheduler(
        `poll:${sheet.id}`,
        { every: sheet.pollInterval * 1000 },
        { name: "poll", data: { sheetId: sheet.id } }
      );
    }

    res.json(sheet);
  } catch (err: any) {
    const status = err?.code ?? err?.status ?? err?.response?.status;
    if (status === 400) {
      res.status(400).json({ error: "Invalid range or tab for this sheet" });
      return;
    }
    console.error("Update sheet error:", err);
    res.status(500).json({ error: "Failed to update sheet" });
  }
});

router.get("/:id/tabs", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  try {
    const sheet = await prisma.sheet.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!sheet) {
      res.status(404).json({ error: "Sheet not found" });
      return;
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const auth = oauthClientFor(user);
    const tabs = await listTabs(sheet.spreadsheetId, auth);
    res.json(tabs);
  } catch (err: any) {
    const status = err?.code ?? err?.status ?? err?.response?.status;
    if (status === 403 || status === 404) {
      res.status(status).json({ error: "Cannot read this sheet's tabs" });
      return;
    }
    console.error("List tabs error:", err);
    res.status(500).json({ error: "Failed to list tabs" });
  }
});

// Grid preview for the visual range picker: first rows × 26 cols of a tab.
router.get("/:id/preview", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const tab = (req.query.tab as string) || null;
  const rowsWanted = Math.min(Number(req.query.rows) || 60, 200);
  try {
    const sheet = await prisma.sheet.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!sheet) {
      res.status(404).json({ error: "Sheet not found" });
      return;
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const auth = oauthClientFor(user);
    const rows = await fetchRange(
      sheet.spreadsheetId,
      buildRange(tab, `A1:Z${rowsWanted}`),
      auth
    );
    res.json({ rows, tab });
  } catch (err: any) {
    const status = err?.code ?? err?.status ?? err?.response?.status;
    if (status === 403 || status === 404) {
      res.status(status).json({ error: "Cannot read this sheet" });
      return;
    }
    console.error("Preview error:", err);
    res.status(500).json({ error: "Failed to load sheet preview" });
  }
});

router.post("/:id/check", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const sheet = await prisma.sheet.findFirst({
    where: { id: req.params.id, userId },
    select: { id: true },
  });
  if (!sheet) {
    res.status(404).json({ error: "Sheet not found" });
    return;
  }
  // Enqueue a one-off poll now (runs on the same processor as scheduled polls).
  await pollQueue.add(
    "poll",
    { sheetId: sheet.id },
    { removeOnComplete: true, removeOnFail: true }
  );
  res.json({ ok: true });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  try {
    await prisma.sheet.delete({ where: { id: req.params.id, userId } });
    await pollQueue.removeJobScheduler(`poll:${req.params.id}`).catch(() => {});
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Sheet not found" });
  }
});

router.get("/:id/changes", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const sheet = await prisma.sheet.findFirst({ where: { id: req.params.id, userId } });
  if (!sheet) {
    res.status(404).json({ error: "Sheet not found" });
    return;
  }
  const changes = await prisma.changeLog.findMany({
    where: { sheetId: req.params.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(changes);
});

export default router;
