// @vitest-environment node
import Redis from "ioredis";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const redisUrl = process.env.INTEGRATION_REDIS_URL;

const { connections } = vi.hoisted(() => ({ connections: { current: null as unknown } }));

vi.mock("@/lib/queue/config", () => ({
  get redisConnection() {
    return connections.current;
  },
}));

import { enforceDistributedRateLimit, publicRateLimitResponse } from "@/lib/middleware/rate-limit";

// Uses unique random namespaces only; never flushes or touches other keys.
describe.skipIf(!redisUrl)("Redis-backed distributed rate limits (two app instances)", () => {
  let instanceA: Redis;
  let instanceB: Redis;

  beforeAll(() => {
    instanceA = new Redis(redisUrl ?? "", { maxRetriesPerRequest: 1 });
    instanceB = new Redis(redisUrl ?? "", { maxRetriesPerRequest: 1 });
  });

  const request = (forwardedFor: string): Request =>
    new Request("http://localhost/api/auth/callback/credentials", {
      method: "POST",
      headers: { "x-forwarded-for": forwardedFor },
    });

  afterAll(async () => {
    instanceA.disconnect();
    instanceB.disconnect();
  });

  it("counts requests from independent instances against one shared window and expires the key", async () => {
    const namespace = `it-${randomUUID()}`;
    const base = { trustedProxyHops: 1, namespace, maxRequests: 10, windowSeconds: 30 };
    const forwarded = "198.51.100.7, 10.0.0.1";

    const outcomes = [];
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const redis = attempt % 2 === 0 ? instanceA : instanceB;
      outcomes.push(
        await enforceDistributedRateLimit({ ...base, redis, request: request(forwarded) }),
      );
    }

    expect(outcomes.slice(0, 10).every((outcome) => outcome.allowed)).toBe(true);
    expect(outcomes.slice(10).every((outcome) => !outcome.allowed)).toBe(true);
    expect(outcomes[11].retryAfterSeconds).toBeGreaterThan(0);
    expect(outcomes[11].retryAfterSeconds).toBeLessThanOrEqual(30);
    expect(await instanceA.ttl(`rate-limit:${namespace}:198.51.100.7`)).toBeGreaterThan(0);
  });

  it("does not let a spoofed left-most forwarded entry escape or poison another client's window", async () => {
    const namespace = `it-${randomUUID()}`;
    const base = {
      trustedProxyHops: 1,
      namespace,
      maxRequests: 2,
      windowSeconds: 30,
      redis: instanceA,
    };

    for (const spoof of ["1.1.1.1", "2.2.2.2", "3.3.3.3", "4.4.4.4"]) {
      await enforceDistributedRateLimit({
        ...base,
        request: request(`${spoof}, 198.51.100.8, 10.0.0.1`),
      });
    }
    const attacker = await enforceDistributedRateLimit({
      ...base,
      request: request("5.5.5.5, 198.51.100.8, 10.0.0.1"),
    });
    const bystander = await enforceDistributedRateLimit({
      ...base,
      request: request("198.51.100.9, 10.0.0.1"),
    });

    expect(attacker.allowed).toBe(false);
    expect(bystander.allowed).toBe(true);
  });

  it("returns 429 with retry metadata from the real route helper and 503 plus an alert when Redis is unreachable", async () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");
    const namespace = `it-${randomUUID()}`;
    connections.current = instanceB;
    const params = { namespace, maxRequests: 10, windowSeconds: 30 };

    let last: Response | null = null;
    for (let attempt = 0; attempt < 11; attempt += 1) {
      last = await publicRateLimitResponse({
        ...params,
        request: request("198.51.100.10, 10.0.0.1"),
      });
    }
    expect(last?.status).toBe(429);
    expect(last?.headers.get("Retry-After")).toBeTruthy();
    expect(last?.headers.get("X-RateLimit-Remaining")).toBe("0");

    const unreachable = new Redis("redis://127.0.0.1:1", {
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      retryStrategy: () => null,
      lazyConnect: true,
    });
    connections.current = unreachable;
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const outage = await publicRateLimitResponse({
      ...params,
      request: request("198.51.100.10, 10.0.0.1"),
    });

    expect(outage?.status).toBe(503);
    expect(errorLog).toHaveBeenCalledWith(
      JSON.stringify({ event: "rate_limit_unavailable", namespace }),
    );
    errorLog.mockRestore();
    unreachable.disconnect();
    vi.unstubAllEnvs();
  });
});
