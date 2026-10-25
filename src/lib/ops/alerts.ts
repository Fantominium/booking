const DEDUPE_WINDOW_MS = 5 * 60 * 1000;
const lastSent = new Map<string, number>();

export type AlertEvent =
  | "rate_limit_unavailable"
  | "pii_purge_failed"
  | "maintenance_job_failed"
  | "email_delivery_exhausted"
  | "outbox_dispatch_failed";

// Structured stderr line is the alerting key for log-based rules; the optional webhook (Slack-compatible) pushes it.
export const emitAlert = async (
  event: AlertEvent,
  fields: Record<string, string | number | boolean> = {},
): Promise<void> => {
  console.error(JSON.stringify({ event, ...fields }));

  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl?.startsWith("https://")) {
    return;
  }

  const dedupeKey = `${event}:${String(fields.namespace ?? fields.job ?? "")}`;
  const now = Date.now();
  if (now - (lastSent.get(dedupeKey) ?? 0) < DEDUPE_WINDOW_MS) {
    return;
  }
  lastSent.set(dedupeKey, now);

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: `[truflow-booking] ${event} ${JSON.stringify(fields)}`,
        event,
        ...fields,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Delivery failure must never break the request path; the stderr line above remains.
  }
};

export const resetAlertDedupeForTests = (): void => {
  lastSent.clear();
};
