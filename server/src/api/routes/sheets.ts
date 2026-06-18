import { Router } from "express";
import prisma from "../../shared/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { oauthClientFor } from "../../shared/google/oauthClient";
import { extractSpreadsheetId, validateAndSnapshot } from "../../shared/google/sheets";
import { hashGrid } from "../../shared/google/diff";
import { pollQueue } from "../../shared/queues";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const sheets = await prisma.sheet.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(sheets);
});

router.post("/", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const { url } = req.body as { url?: string };

  if (!url) {
    res.status(400).json({ error: "url required" });
    return;
  }

  try {
    const spreadsheetId = extractSpreadsheetId(url);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const auth = oauthClientFor(user);
    const { label, rows } = await validateAndSnapshot(spreadsheetId, "A1:Z1000", auth);

    const sheet = await prisma.sheet.create({
      data: {
        userId,
        spreadsheetId,
        label,
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
  const { notifyEmail, notifyPush } = req.body as {
    notifyEmail?: boolean;
    notifyPush?: boolean;
  };

  try {
    const sheet = await prisma.sheet.update({
      where: { id: req.params.id, userId },
      data: {
        ...(notifyEmail !== undefined && { notifyEmail }),
        ...(notifyPush !== undefined && { notifyPush }),
      },
    });
    res.json(sheet);
  } catch {
    res.status(404).json({ error: "Sheet not found" });
  }
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
