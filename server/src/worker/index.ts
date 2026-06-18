import "../shared/env";
import { createPollWorker } from "./pollWorker";
import { createNotifyWorker } from "./notifyWorker";
import { ensureAllSheetJobs } from "./scheduler";

const pollWorker = createPollWorker();
const notifyWorker = createNotifyWorker();

pollWorker.on("failed", (job, err) => {
  console.error(`Poll job ${job?.id} failed:`, err.message);
});

notifyWorker.on("failed", (job, err) => {
  console.error(`Notify job ${job?.id} failed:`, err.message);
});

ensureAllSheetJobs().catch(console.error);

console.log("Worker started — poll + notify workers running");
