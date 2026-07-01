import { Router } from "express";
import prisma from "../../shared/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { sendPush } from "../../shared/notify/push";

const router = Router();

router.post("/test", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) {
    res.status(400).json({ error: "No push devices. Click “Enable push” first." });
    return;
  }
  const payload = {
    title: "SheetWatch test",
    body: "Push notifications are working 🎉",
    url: "/",
  };
  await Promise.all(
    subs.map((s) =>
      sendPush({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
    )
  );
  res.json({ ok: true, sent: subs.length });
});

router.post("/subscribe", requireAuth, async (req, res) => {
  const userId = req.session!.userId as string;
  const { endpoint, keys } = req.body as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Invalid subscription object" });
    return;
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId, p256dh: keys.p256dh, auth: keys.auth },
  });

  res.json({ ok: true });
});

router.delete("/subscribe", requireAuth, async (req, res) => {
  const { endpoint } = req.body as { endpoint?: string };
  if (!endpoint) {
    res.status(400).json({ error: "endpoint required" });
    return;
  }
  await prisma.pushSubscription.deleteMany({ where: { endpoint } }).catch(() => {});
  res.json({ ok: true });
});

export default router;
