import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/queue/config", () => ({
  redisConnection: { eval: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) },
}));

import { publicRateLimitResponse } from "@/lib/middleware/rate-limit";

describe("Redis outage policy (D8a)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fails closed with 503 and emits a structured alert event without client data", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await publicRateLimitResponse({
      request: new Request("http://localhost/api/bookings", {
        headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
      }),
      namespace: "booking",
      maxRequests: 5,
      windowSeconds: 600,
    });

    expect(response?.status).toBe(503);
    expect(errorLog).toHaveBeenCalledWith(
      JSON.stringify({ event: "rate_limit_unavailable", namespace: "booking" }),
    );
    expect(errorLog.mock.calls.flat().join(" ")).not.toContain("203.0.113.9");
  });
});
