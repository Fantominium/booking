import { emitAlert, type AlertEvent } from "@/lib/ops/alerts";

const events: AlertEvent[] = [
  "rate_limit_unavailable",
  "pii_purge_failed",
  "maintenance_job_failed",
  "email_delivery_exhausted",
  "outbox_dispatch_failed",
];

const main = async (): Promise<void> => {
  if (!process.env.ALERT_WEBHOOK_URL?.startsWith("https://")) {
    process.stderr.write("Set ALERT_WEBHOOK_URL to an https URL to verify webhook delivery.\n");
    process.exitCode = 1;
    return;
  }

  for (const event of events) {
    await emitAlert(event, { test: true, job: `test-${event}` });
  }
  process.stderr.write(`Sent ${events.length} test alerts; confirm each arrived in the monitored channel.\n`);
};

void main();
