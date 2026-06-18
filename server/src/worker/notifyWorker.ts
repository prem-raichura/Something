import { Worker, Job } from "bullmq";
import { connection } from "../shared/redis";
import prisma from "../shared/prisma";
import { sendEmail } from "../shared/notify/email";
import { sendPush } from "../shared/notify/push";

interface NotifyJobData {
  sheetId: string;
  changeLogId: string;
}

export function createNotifyWorker() {
  return new Worker<NotifyJobData>(
    "notify",
    async (job: Job<NotifyJobData>) => {
      const { sheetId, changeLogId } = job.data;

      const [sheet, changeLog] = await Promise.all([
        prisma.sheet.findUnique({
          where: { id: sheetId },
          include: { user: { include: { pushSubs: true } } },
        }),
        prisma.changeLog.findUnique({ where: { id: changeLogId } }),
      ]);

      if (!sheet || !changeLog) return;

      const payload = {
        title: `${sheet.label} changed`,
        body: changeLog.summary,
        url: `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}`,
      };

      const tasks: Promise<void>[] = [];

      if (sheet.notifyEmail) {
        tasks.push(sendEmail(sheet.user.email, payload));
      }

      if (sheet.notifyPush && sheet.user.pushSubs.length > 0) {
        for (const sub of sheet.user.pushSubs) {
          tasks.push(sendPush({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload));
        }
      }

      await Promise.allSettled(tasks);
    },
    { connection }
  );
}
