import { Router } from "express";
import prisma from "../../shared/prisma";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { sheets: true } } },
  });
  res.json(
    projects.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      sortOrder: p.sortOrder,
      notifyEmail: p.notifyEmail,
      notifyPush: p.notifyPush,
      sheetCount: p._count.sheets,
    }))
  );
});

router.post("/", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const { name, color } = req.body as { name?: string; color?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: "name required" });
    return;
  }
  const max = await prisma.project.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });
  const project = await prisma.project.create({
    data: {
      userId,
      name: name.trim(),
      ...(color && { color }),
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  res.status(201).json(project);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const { name, color, notifyEmail, notifyPush, sortOrder, applyNotifyToSheets } =
    req.body as {
      name?: string;
      color?: string;
      notifyEmail?: boolean;
      notifyPush?: boolean;
      sortOrder?: number;
      applyNotifyToSheets?: boolean;
    };

  try {
    const project = await prisma.project.update({
      where: { id: req.params.id, userId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
        ...(notifyEmail !== undefined && { notifyEmail }),
        ...(notifyPush !== undefined && { notifyPush }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    // Optionally cascade notification defaults onto member sheets.
    if (applyNotifyToSheets && (notifyEmail !== undefined || notifyPush !== undefined)) {
      await prisma.sheet.updateMany({
        where: { projectId: project.id, userId },
        data: {
          ...(notifyEmail !== undefined && { notifyEmail }),
          ...(notifyPush !== undefined && { notifyPush }),
        },
      });
    }

    res.json(project);
  } catch {
    res.status(404).json({ error: "Project not found" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  try {
    // Detach sheets (keep them) then delete the project.
    await prisma.sheet.updateMany({
      where: { projectId: req.params.id, userId },
      data: { projectId: null },
    });
    await prisma.project.delete({ where: { id: req.params.id, userId } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Project not found" });
  }
});

export default router;
