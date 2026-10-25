import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { emitAlert, resetAlertDedupeForTests } from "@/lib/ops/alerts";

describe("operational alerts", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    resetAlertDedupeForTests();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    fetchMock.mockReset();
  });

  it("always writes the structured log line, even without a webhook", async () => {
    await emitAlert("rate_limit_unavailable", { namespace: "booking" });

    expect(console.error).toHaveBeenCalledWith('{"event":"rate_limit_unavailable","namespace":"booking"}');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to an https webhook once per five-minute window per event and namespace", async () => {
    vi.stubEnv("ALERT_WEBHOOK_URL", "https://hooks.example.com/alert");
    fetchMock.mockResolvedValue(new Response("ok"));

    await emitAlert("rate_limit_unavailable", { namespace: "booking" });
    await emitAlert("rate_limit_unavailable", { namespace: "booking" });
    await emitAlert("rate_limit_unavailable", { namespace: "login" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refuses non-https webhooks and swallows delivery failures", async () => {
    vi.stubEnv("ALERT_WEBHOOK_URL", "http://insecure.example.com");
    await emitAlert("pii_purge_failed", { job: "privacy-maintenance" });
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv("ALERT_WEBHOOK_URL", "https://hooks.example.com/alert");
    fetchMock.mockRejectedValue(new Error("network"));
    await expect(emitAlert("pii_purge_failed", { job: "x" })).resolves.toBeUndefined();
  });
});
