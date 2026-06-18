import prisma from "../shared/prisma";
import { pollQueue } from "../shared/queues";

export async function ensureAllSheetJobs(): Promise<void> {
  const sheets = await prisma.sheet.findMany({
    select: { id: true, pollInterval: true },
  });

  await Promise.all(
    sheets.map((sheet) =>
      pollQueue.upsertJobScheduler(
        `poll:${sheet.id}`,
        { every: sheet.pollInterval * 1000 },
        { name: "poll", data: { sheetId: sheet.id } }
      )
    )
  );

  console.log(`Scheduled ${sheets.length} sheet poll job(s)`);
}
