import { Router } from "express";
import prisma from "../../shared/prisma";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [tracked, paused, errored, projects, changesToday, last] = await Promise.all([
    prisma.sheet.count({ where: { userId } }),
    prisma.sheet.count({ where: { userId, paused: true } }),
    prisma.sheet.count({ where: { userId, errorMessage: { not: null } } }),
    prisma.project.count({ where: { userId } }),
    prisma.changeLog.count({
      where: { sheet: { userId }, createdAt: { gte: startOfDay } },
    }),
    prisma.changeLog.findFirst({
      where: { sheet: { userId } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  res.json({
    tracked,
    paused,
    active: tracked - paused,
    errored,
    projects,
    changesToday,
    lastChangeAt: last?.createdAt ?? null,
  });
});

export default router;
