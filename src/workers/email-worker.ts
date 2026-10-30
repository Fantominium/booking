import { Worker } from "bullmq";

import { EMAIL_QUEUE_NAME, redisConnection } from "@/lib/queue/config";
import { emitAlert } from "@/lib/ops/alerts";
import { processEmailJob } from "@/workers/email-job-handler";
import "@/workers/maintenance-worker";

export const emailWorker = new Worker(EMAIL_QUEUE_NAME, processEmailJob, {
  connection: redisConnection,
  concurrency: 10,
});

emailWorker.on("failed", (job) => {
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    void emitAlert("email_delivery_exhausted", { job: job.name, attemptsMade: job.attemptsMade });
  }
});
