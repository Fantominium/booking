// @vitest-environment node
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const isIsolatedTestDatabase = Boolean(databaseUrl && /\/[^/?]*_test(\?|$)/.test(databaseUrl));

const { testPrisma } = vi.hoisted(() => ({ testPrisma: { current: null as unknown } }));

vi.mock("@/lib/prisma", async () => {
  const prismaPackage = await import("@prisma/client");
  testPrisma.current = new prismaPackage.PrismaClient({ datasourceUrl: process.env.INTEGRATION_DATABASE_URL });
  return { prisma: testPrisma.current };
});
vi.mock("@/lib/email/config", () => ({ resend: { emails: { send: vi.fn() } } }));
vi.mock("@/lib/email/templates/deletion-request", () => ({ DeletionRequestEmail: vi.fn() }));

import { purgeOldCustomerData } from "@/lib/services/data-deletion";

// Destructive: runs only against a database whose name ends in `_test`.
describe.skipIf(!isIsolatedTestDatabase)("PostgreSQL PII purge", () => {
  const prisma = (): PrismaClient => testPrisma.current as PrismaClient;
  const now = new Date("2030-06-15T00:00:00Z");
  const monthsAgo = (months: number): Date => new Date(Date.UTC(2030, 5 - months, 15, 10, 0, 0));
  let serviceId = "";
  let slot = 0;

  const booking = (email: string, start: Date): Promise<unknown> => {
    slot += 1;
    return prisma().booking.create({
      data: {
        serviceId,
        customerName: "Real Name",
        customerEmail: email,
        customerPhone: "555-0100",
        startTime: start,
        endTime: new Date(start.getTime() + 2 * 60 * 60 * 1000),
        remainingBalanceCents: 100 + slot,
      },
    });
  };

  beforeEach(async () => {
    await prisma().dataDeletionAuditLog.deleteMany();
    await prisma().paymentAuditLog.deleteMany();
    await prisma().booking.deleteMany();
    await prisma().service.deleteMany();
    serviceId = (
      await prisma().service.create({
        data: {
          name: "Purge Service",
          description: "x",
          offeringType: "SESSION",
          durationMin: 60,
          priceCents: 8000,
          downpaymentCents: 2000,
        },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma()?.$disconnect();
  });

  it("anonymizes only bookings older than 24 months, keeps financial fields, audits, and is idempotent", async () => {
    await booking("returning@example.com", monthsAgo(30));
    await booking("returning@example.com", monthsAgo(-2));
    await booking("old-only@example.com", monthsAgo(26));
    await booking("recent@example.com", monthsAgo(6));

    expect(await purgeOldCustomerData(now)).toBe(2);

    const rows = await prisma().booking.findMany({ orderBy: { startTime: "asc" } });
    expect(rows.map((row) => row.customerEmail.startsWith("redacted+"))).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(rows.filter((row) => row.customerEmail === "returning@example.com")).toHaveLength(1);
    expect(rows.every((row) => row.remainingBalanceCents > 0)).toBe(true);
    expect(await prisma().dataDeletionAuditLog.count({ where: { deletionReason: "AUTO_PURGE_AGE" } })).toBe(2);

    expect(await purgeOldCustomerData(now)).toBe(0);
    expect(await prisma().dataDeletionAuditLog.count()).toBe(2);
  });
});
