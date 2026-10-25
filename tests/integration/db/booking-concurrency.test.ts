// @vitest-environment node
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createBookingWithLock, type CreateBookingInput } from "@/lib/services/booking";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const isIsolatedTestDatabase = Boolean(databaseUrl && /\/[^/?]*_test(\?|$)/.test(databaseUrl));

// Destructive: runs only against a database whose name ends in `_test`.
describe.skipIf(!isIsolatedTestDatabase)("PostgreSQL booking concurrency", () => {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  let serviceId = "";

  const dayStart = new Date(Date.UTC(2030, 5, 11, 4, 0, 0));
  const dayEnd = new Date(Date.UTC(2030, 5, 12, 4, 0, 0));
  const at = (hour: number, minute = 0): Date => new Date(Date.UTC(2030, 5, 11, hour, minute, 0));

  let keyCounter = 0;
  const input = (overrides: Partial<CreateBookingInput> = {}): CreateBookingInput => {
    keyCounter += 1;
    const key = `00000000-0000-4000-8000-${String(keyCounter).padStart(12, "0")}`;
    return {
      serviceId,
      customerName: "Integration Customer",
      customerEmail: "integration@example.com",
      customerPhone: "555-0100",
      startTime: at(14),
      paymentMethod: "BANK_TRANSFER",
      serviceDurationMin: 60,
      bufferMinutes: 60,
      priceCents: 8000,
      downpaymentCents: 2000,
      maxBookingsPerDay: 8,
      dayStart,
      dayEnd,
      idempotencyKey: key,
      requestFingerprint: `fp-${key}`,
      minimumLeadTimeMinutes: 120,
      ...overrides,
    };
  };
  const attempt = (
    overrides: Partial<CreateBookingInput> = {},
  ): Promise<{ ok: true; value: unknown } | { ok: false; status: number | undefined }> =>
    createBookingWithLock({ prisma, input: input(overrides) }).then(
      (value) => ({ ok: true as const, value }),
      (error: { statusCode?: number }) => ({ ok: false as const, status: error.statusCode }),
    );

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.bookingIdempotency.deleteMany();
    await prisma.paymentAuditLog.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    const service = await prisma.service.create({
      data: {
        name: "Integration Service",
        description: "Integration test service",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 8000,
        downpaymentCents: 2000,
      },
    });
    serviceId = service.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("commits exactly one of many parallel requests for the same slot", async () => {
    const results = await Promise.all(Array.from({ length: 12 }, () => attempt()));

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok && result.status === 409)).toHaveLength(11);
    expect(await prisma.booking.count()).toBe(1);
  });

  it("rejects unequal-start overlap, in-buffer neighbours, and spanning intervals", async () => {
    expect((await attempt({ startTime: at(14) })).ok).toBe(true);

    const overlapping = await Promise.all([
      attempt({ startTime: at(14, 30) }),
      attempt({ startTime: at(13, 0) }),
      attempt({ startTime: at(15, 30) }),
      attempt({ startTime: at(12, 0), serviceDurationMin: 300 }),
    ]);

    expect(overlapping.every((result) => !result.ok && result.status === 409)).toBe(true);
    expect(await prisma.booking.count()).toBe(1);
  });

  it("allows a booking that starts exactly when the previous interval (with buffer) ends", async () => {
    expect((await attempt({ startTime: at(14) })).ok).toBe(true);
    expect((await attempt({ startTime: at(16) })).ok).toBe(true);
    expect((await attempt({ startTime: at(12) })).ok).toBe(true);
  });

  it("enforces the daily cap under parallel distinct-slot requests", async () => {
    const starts = [8, 10, 12, 14, 16, 18].map((hour) => at(hour));
    const results = await Promise.all(
      starts.map((startTime) => attempt({ startTime, maxBookingsPerDay: 2 })),
    );

    expect(results.filter((result) => result.ok)).toHaveLength(2);
    expect(await prisma.booking.count()).toBe(2);
  });

  it("returns one booking for parallel retries with the same idempotency key", async () => {
    const shared = input();
    const results = await Promise.all(
      Array.from({ length: 6 }, () => createBookingWithLock({ prisma, input: shared })),
    );

    expect(new Set(results.map((result) => result.id)).size).toBe(1);
    expect(results.filter((result) => !result.replayed)).toHaveLength(1);
    expect(await prisma.booking.count()).toBe(1);
  });

  it("blocks overlapping active rows at the database even when the application lock is bypassed", async () => {
    const row = (startTime: Date, endTime: Date): Promise<unknown> =>
      prisma.booking.create({
        data: {
          serviceId,
          customerName: "Direct Insert",
          customerEmail: "direct@example.com",
          customerPhone: "555-0100",
          startTime,
          endTime,
          remainingBalanceCents: 0,
        },
      });

    await row(at(14), at(16));

    await expect(row(at(15), at(17))).rejects.toThrow();
    await expect(row(at(16), at(18))).resolves.toBeDefined();
  });

  it("rejects an idempotency key reused with a different payload", async () => {
    const first = input();
    await createBookingWithLock({ prisma, input: first });

    const reuse = await createBookingWithLock({
      prisma,
      input: { ...first, requestFingerprint: "different-payload" },
    }).catch((error: { statusCode?: number }) => error);

    expect(reuse).toMatchObject({ statusCode: 409 });
    expect(await prisma.booking.count()).toBe(1);
  });

  it("releases capacity when a booking is cancelled or expired", async () => {
    const first = await attempt();
    expect(first.ok).toBe(true);
    await prisma.booking.updateMany({ data: { status: "CANCELLED" } });

    expect((await attempt()).ok).toBe(true);

    await prisma.booking.updateMany({ data: { status: "EXPIRED" } });
    expect((await attempt({ maxBookingsPerDay: 1, startTime: at(18) })).ok).toBe(true);
  });

  it("rejects starts inside the two-hour lead time without side effects", async () => {
    const result = await attempt({ startTime: new Date(Date.now() + 60 * 60 * 1000) });

    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(await prisma.booking.count()).toBe(0);
    expect(await prisma.bookingIdempotency.count()).toBe(0);
  });
});
