import { Router } from "express";
import prisma from "../../shared/prisma";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const changes = await prisma.changeLog.findMany({
    where: { sheet: { userId } },
    include: {
      sheet: { select: { label: true, spreadsheetId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  res.json(changes);
});

export default router;
