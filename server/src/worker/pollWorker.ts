import { Worker, Job } from "bullmq";
import { Prisma } from "@prisma/client";
import { connection } from "../shared/redis";
import prisma from "../shared/prisma";
import { oauthClientFor } from "../shared/google/oauthClient";
import { fetchRange } from "../shared/google/sheets";
import { hashGrid, diffGrid } from "../shared/google/diff";
import { notifyQueue } from "../shared/queues";

interface PollJobData {
  sheetId: string;
}

export function createPollWorker() {
  return new Worker<PollJobData>(
    "poll",
    async (job: Job<PollJobData>) => {
      const { sheetId } = job.data;

      const sheet = await prisma.sheet.findUnique({
        where: { id: sheetId },
        include: { user: true },
      });

      if (!sheet) return;

      try {
        const auth = oauthClientFor(sheet.user);
        const rows = await fetchRange(sheet.spreadsheetId, sheet.range, auth);
        const newHash = hashGrid(rows);

        await prisma.sheet.update({
          where: { id: sheetId },
          data: { lastCheckedAt: new Date(), errorMessage: null },
        });

        if (newHash === sheet.lastHash) return;

        const oldRows = (sheet.lastSnapshot as string[][] | null) ?? [];
        const changes = diffGrid(oldRows, rows);

        const changeLog = await prisma.changeLog.create({
          data: {
            sheetId,
            summary: `${changes.length} cell${changes.length !== 1 ? "s" : ""} changed`,
            details: changes as unknown as Prisma.InputJsonValue,
          },
        });

        await prisma.sheet.update({
          where: { id: sheetId },
          data: { lastHash: newHash, lastSnapshot: rows },
        });

        await notifyQueue.add("notify", { sheetId, changeLogId: changeLog.id });
      } catch (err: any) {
        const status = err?.code ?? err?.status ?? err?.response?.status;

        if (status === 401 || status === 403) {
          await prisma.sheet.update({
            where: { id: sheetId },
            data: { errorMessage: "Access denied — re-authorize in the app." },
          });
          return;
        }

        if (status === 404) {
          await prisma.sheet.update({
            where: { id: sheetId },
            data: { errorMessage: "Sheet not found or deleted." },
          });
          return;
        }

        throw err;
      }
    },
    { connection, concurrency: 5 }
  );
}
