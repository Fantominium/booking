import { afterEach, describe, expect, it, vi } from "vitest";

const { bookingFindMany, bookingUpdateMany, auditCreate } = vi.hoisted(() => ({
  bookingFindMany: vi.fn(),
  bookingUpdateMany: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findMany: bookingFindMany, updateMany: bookingUpdateMany },
    dataDeletionAuditLog: { create: auditCreate },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  },
}));
vi.mock("@/lib/email/config", () => ({ resend: { emails: { send: vi.fn() } } }));
vi.mock("@/lib/email/templates/deletion-request", () => ({ DeletionRequestEmail: vi.fn() }));

import { purgeOldCustomerData } from "@/lib/services/data-deletion";

describe("customer PII retention policy (D9a)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("anonymizes customers whose bookings ended more than 24 months ago, once per distinct email", async () => {
    bookingFindMany.mockResolvedValue([
      { customerEmail: "a@example.com" },
      { customerEmail: "redacted+abc@truflow.local" },
    ]);

    const count = await purgeOldCustomerData(new Date("2030-06-15T00:00:00Z"));

    expect(bookingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { endTime: { lt: new Date("2028-06-15T00:00:00Z") } } }),
    );
    expect(count).toBe(1);
    expect(bookingUpdateMany).toHaveBeenCalledTimes(1);
    expect(bookingUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          customerEmail: "a@example.com",
          endTime: { lt: new Date("2028-06-15T00:00:00Z") },
        },
      }),
    );
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deletionReason: "AUTO_PURGE_AGE" }),
      }),
    );
  });

  it("continues past a failing customer, alerts, and fails the job", async () => {
    bookingFindMany.mockResolvedValue([
      { customerEmail: "bad@example.com" },
      { customerEmail: "ok@example.com" },
    ]);
    bookingUpdateMany.mockImplementationOnce(() => Promise.reject(new Error("db down")));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(purgeOldCustomerData(new Date("2030-06-15T00:00:00Z"))).rejects.toThrow(
      /1 customer/,
    );

    expect(bookingUpdateMany).toHaveBeenCalledTimes(2);
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('"event":"pii_purge_failed"'));
    errorLog.mockRestore();
  });

  it("does nothing while a legal hold is active", async () => {
    vi.stubEnv("PII_PURGE_LEGAL_HOLD", "true");

    expect(await purgeOldCustomerData()).toBe(0);
    expect(bookingFindMany).not.toHaveBeenCalled();
    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });
});
