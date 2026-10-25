import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("production bank-transfer configuration", () => {
  it("loads required runtime config when Stripe variables are absent", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://app:secret@db.internal:5432/bookings");
    vi.stubEnv("RESEND_API_KEY", "re_test_provider");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "bookings@example.test");
    vi.stubEnv("NEXTAUTH_SECRET", "test-only-secret-value");
    vi.stubEnv("IDEMPOTENCY_HMAC_SECRET", "stable-idempotency-secret-for-tests");
    vi.stubEnv("REDIS_URL", "redis://redis.internal:6379");
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.WEBHOOK_URL_TOKEN;
    vi.resetModules();

    const config = await import("@/lib/config/env");

    expect(config.env).toMatchObject({
      DATABASE_URL: "postgresql://app:secret@db.internal:5432/bookings",
      RESEND_API_KEY: "re_test_provider",
      EMAIL_FROM_ADDRESS: "bookings@example.test",
      IDEMPOTENCY_HMAC_SECRET: "stable-idempotency-secret-for-tests",
      REDIS_URL: "redis://redis.internal:6379",
    });
    expect(config.env.STRIPE_SECRET_KEY).toBeUndefined();
    expect(config.env.WEBHOOK_URL_TOKEN).toBeUndefined();
  });

  it("fails closed in production when the idempotency fingerprint secret is absent", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://app:secret@db.internal:5432/bookings");
    vi.stubEnv("RESEND_API_KEY", "re_test_provider");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "bookings@example.test");
    vi.stubEnv("NEXTAUTH_SECRET", "test-only-secret-value");
    vi.stubEnv("REDIS_URL", "redis://redis.internal:6379");
    vi.stubEnv("IDEMPOTENCY_HMAC_SECRET", "");
    vi.resetModules();

    await expect(import("@/lib/config/env")).rejects.toThrow(/IDEMPOTENCY_HMAC_SECRET/);
  });
});
