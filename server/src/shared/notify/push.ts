import webpush from "web-push";
import prisma from "../prisma";
import { NotifyPayload } from "../types";

webpush.setVapidDetails(
  process.env.VAPID_MAILTO ?? "mailto:admin@sheetwatch.app",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushSub {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function sendPush(sub: PushSub, payload: NotifyPayload): Promise<void> {
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload));
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => {});
    }
  }
}
