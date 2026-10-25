// @vitest-environment node
import Redis from "ioredis";
import { randomInt } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";

const redisUrl = process.env.INTEGRATION_REDIS_URL;

const { connection } = vi.hoisted(() => ({ connection: { current: null as unknown } }));

vi.mock("@/lib/queue/config", () => ({
  get redisConnection() {
    return connection.current;
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { admin: { findUnique: vi.fn().mockResolvedValue(null) }, passwordResetToken: { findUnique: vi.fn().mockResolvedValue(null) } },
}));
vi.mock("@/lib/services/data-deletion", () => ({
  createDeletionRequest: vi.fn().mockResolvedValue("token"),
  confirmDeletionRequest: vi.fn().mockRejectedValue(new Error("Invalid token")),
}));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn(), verifyPassword: vi.fn() }));

import { POST as resetRequest } from "@/app/api/auth/password-reset/request/route";
import { POST as resetConfirm } from "@/app/api/auth/password-reset/confirm/route";
import { POST as deletionRequest } from "@/app/api/customer-data/request-deletion/route";
import { POST as deletionConfirm } from "@/app/api/customer-data/confirm-deletion/route";

type Route = (request: Request) => Promise<Response>;

// Each run uses a random TEST-NET-3 address and deletes only its own keys.
describe.skipIf(!redisUrl)("route-level rate limits against real Redis", () => {
  const redis = new Redis(redisUrl ?? "", { maxRetriesPerRequest: 1 });
  connection.current = redis;
  const clientIp = `203.0.113.${randomInt(1, 255)}`;
  const namespaces = [
    "password-reset-request",
    "password-reset-confirm",
    "customer-deletion-request",
    "customer-deletion-confirm",
  ];

  const call = (route: Route, path: string, body: unknown): Promise<Response> =>
    route(
      new Request(`http://localhost${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": `${clientIp}, 10.0.0.1` },
        body: JSON.stringify(body),
      }),
    );

  afterAll(async () => {
    await redis.del(...namespaces.map((namespace) => `rate-limit:${namespace}:${clientIp}`));
    redis.disconnect();
  });

  it.each([
    ["password reset request", resetRequest, "/api/auth/password-reset/request", { email: "admin@example.com" }, 5],
    ["password reset confirm", resetConfirm, "/api/auth/password-reset/confirm", { token: "x", newPassword: "password123" }, 5],
    ["deletion request", deletionRequest, "/api/customer-data/request-deletion", { email: "customer@example.com" }, 3],
    ["deletion confirm", deletionConfirm, "/api/customer-data/confirm-deletion", { token: "x".repeat(32) }, 5],
  ] as const)("%s allows the approved limit then returns 429 with retry metadata", async (_name, route, path, body, limit) => {
    const allowed: number[] = [];
    for (let attempt = 0; attempt < limit; attempt += 1) {
      allowed.push((await call(route, path, body)).status);
    }
    const limited = await call(route, path, body);

    expect(allowed.every((status) => status !== 429 && status !== 503)).toBe(true);
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(await limited.json()).toMatchObject({ error: { code: "RATE_LIMITED" } });
  });
});
