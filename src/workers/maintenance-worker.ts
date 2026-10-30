import { Worker } from "bullmq";

import { MAINTENANCE_QUEUE_NAME, redisConnection } from "@/lib/queue/config";
import {
  enqueueMaintenanceSchedules,
  runMaintenanceJob,
  type MaintenanceJobName,
} from "@/lib/jobs/maintenance";
import { emitAlert } from "@/lib/ops/alerts";

const maintenanceJobNames: readonly string[] = [
  "advance-transfer-expiry",
  "privacy-maintenance",
  "dispatch-email-outbox",
];
const isMaintenanceJobName = (name: string): name is MaintenanceJobName =>
  maintenanceJobNames.includes(name);

export const maintenanceWorker = new Worker(
  MAINTENANCE_QUEUE_NAME,
  async (job) => {
    if (!isMaintenanceJobName(job.name)) {
      throw new Error("Unsupported maintenance job");
    }
    return runMaintenanceJob({ name: job.name });
  },
  { connection: redisConnection, concurrency: 1 },
);

maintenanceWorker.on("failed", (job) => {
  void emitAlert("maintenance_job_failed", {
    job: job?.name ?? "unknown",
    attemptsMade: job?.attemptsMade ?? 0,
  });
});

void enqueueMaintenanceSchedules();
