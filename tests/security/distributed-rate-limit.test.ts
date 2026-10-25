import { describe, expect, it, vi } from "vitest";

import { enforceDistributedRateLimit, getTrustedClientIp } from "@/lib/middleware/rate-limit";

const createSharedRedis = (): { eval: ReturnType<typeof vi.fn> } => {
  const counters = new Map<string, number>();
  return {
    eval: vi.fn(async (_script: string, _keyCount: number, key: string) => {
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      return [next, 120];
    }),
  };
};

describe("distributed public rate limits", () => {
  it("shares atomic request counts across independent app callers", async () => {
    const redis = createSharedRedis();
    const options = {
      redis: redis as never,
      request: new Request("http://localhost/api/bookings", {
        headers: { "x-forwarded-for": "198.51.100.22, 10.0.0.4" },
      }),
      trustedProxyHops: 1,
      namespace: "booking",
      maxRequests: 2,
      windowSeconds: 120,
    };

    const firstInstance = await enforceDistributedRateLimit(options);
    const secondInstance = await enforceDistributedRateLimit(options);
    const thirdInstance = await enforceDistributedRateLimit(options);

    expect(firstInstance.allowed).toBe(true);
    expect(secondInstance.allowed).toBe(true);
    expect(thirdInstance.allowed).toBe(false);
    expect(thirdInstance.retryAfterSeconds).toBeGreaterThan(0);
    expect(redis.eval).toHaveBeenCalledTimes(3);
  });

  it("derives the client IP from the trusted ingress position and ignores spoofed left entries", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "203.0.113.99, 198.51.100.17, 10.0.0.4",
        "x-real-ip": "203.0.113.99",
      },
    });

    expect(getTrustedClientIp(request, 1)).toBe("198.51.100.17");
  });
});
