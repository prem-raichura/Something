import { Queue } from "bullmq";
import { connection } from "./redis";

export const pollQueue = new Queue("poll", { connection });
export const notifyQueue = new Queue("notify", { connection });
