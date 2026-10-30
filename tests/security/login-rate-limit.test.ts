import { afterEach, describe, expect, it, vi } from "vitest";

const { limiter, nextAuthHandler } = vi.hoisted(() => ({
  limiter: vi.fn(),
  nextAuthHandler: vi.fn(),
}));

vi.mock("@/lib/middleware/rate-limit", () => ({ publicRateLimitResponse: limiter }));
vi.mock("next-auth", () => ({ default: () => nextAuthHandler }));
vi.mock("next-auth/providers/credentials", () => ({ default: (config: unknown) => config }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/config/env", () => ({ env: { NEXTAUTH_SECRET: "test-secret" } }));

import { POST } from "@/app/api/auth/[...nextauth]/route";

const context = { params: Promise.resolve({ nextauth: ["callback", "credentials"] }) } as never;

describe("admin login throttling (D8)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("applies 10 attempts per 15 minutes to credential submissions and short-circuits when limited", async () => {
    const limited = Response.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });
    limiter.mockResolvedValue(limited);

    const response = await POST(
      new Request("http://localhost/api/auth/callback/credentials", { method: "POST" }),
      context,
    );

    expect(response.status).toBe(429);
    expect(limiter).toHaveBeenCalledWith(
      expect.objectContaining({ namespace: "login", maxRequests: 10, windowSeconds: 900 }),
    );
    expect(nextAuthHandler).not.toHaveBeenCalled();
  });

  it("does not throttle non-credential auth requests such as sign-out", async () => {
    nextAuthHandler.mockResolvedValue(new Response("ok"));

    await POST(new Request("http://localhost/api/auth/signout", { method: "POST" }), context);

    expect(limiter).not.toHaveBeenCalled();
    expect(nextAuthHandler).toHaveBeenCalledOnce();
  });

  it("rejects extra segments after callback/credentials instead of bypassing the limiter", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/callback/credentials/extra", { method: "POST" }),
      context,
    );

    expect(response.status).toBe(404);
    expect(nextAuthHandler).not.toHaveBeenCalled();
  });
});
