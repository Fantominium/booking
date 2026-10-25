import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { createBookingWithLock } from "@/lib/services/booking";

vi.mock("@/lib/services/audit", () => ({ logPaymentAudit: vi.fn() }));
vi.mock("@/lib/services/email", () => ({ queueEmailJob: vi.fn() }));

describe("booking conflict", () => {
  it("treats every service as the same approved shared provider resource", async () => {
    const queryRaw = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "booking-from-another-service" }]);
    const create = vi.fn();
    const transactionClient = {
      $queryRaw: queryRaw,
      booking: { create },
      bookingIdempotency: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (transaction: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
      ),
    } as unknown as PrismaClient;

    await expect(
      createBookingWithLock({
        prisma,
        input: {
          serviceId: "service-2",
          customerName: "Customer",
          customerEmail: "customer@example.com",
          customerPhone: "555-0100",
          startTime: new Date("2030-01-01T11:30:00.000Z"),
          paymentMethod: "BANK_TRANSFER",
          serviceDurationMin: 60,
          bufferMinutes: 60,
          priceCents: 8000,
          downpaymentCents: 2000,
          maxBookingsPerDay: 8,
          dayStart: new Date("2030-01-01T00:00:00.000Z"),
          dayEnd: new Date("2030-01-02T00:00:00.000Z"),
          idempotencyKey: "b4c42c9c-5e9e-4c28-9c47-c3c2f9f84511",
          requestFingerprint: "shared-resource-fingerprint",
          minimumLeadTimeMinutes: 120,
        },
      }),
    ).rejects.toThrow("Slot");

    const resourceLockQuery = String.raw(queryRaw.mock.calls[0][0] as TemplateStringsArray);
    expect(resourceLockQuery).toContain("booking-resource:shared-provider");
    const conflictQuery = String.raw(queryRaw.mock.calls[1][0] as TemplateStringsArray);
    expect(conflictQuery).not.toContain('"service_id" =');
    expect(create).not.toHaveBeenCalled();
  });

  it("serializes a resource and rejects any overlapping interval", async () => {
    const queryRaw = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "existing-booking" }]);
    const create = vi.fn();
    const transactionClient = {
      $queryRaw: queryRaw,
      booking: { create },
      bookingIdempotency: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (transaction: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
      ),
    } as unknown as PrismaClient;

    await expect(
      createBookingWithLock({
        prisma,
        input: {
          serviceId: "service-1",
          customerName: "Customer",
          customerEmail: "customer@example.com",
          customerPhone: "555-0100",
          startTime: new Date("2030-01-01T11:30:00.000Z"),
          paymentMethod: "BANK_TRANSFER",
          serviceDurationMin: 60,
          bufferMinutes: 60,
          priceCents: 8000,
          downpaymentCents: 2000,
          maxBookingsPerDay: 8,
          dayStart: new Date("2030-01-01T00:00:00.000Z"),
          dayEnd: new Date("2030-01-02T00:00:00.000Z"),
          idempotencyKey: "b4c42c9c-5e9e-4c28-9c47-c3c2f9f84512",
          requestFingerprint: "overlap-fingerprint",
          minimumLeadTimeMinutes: 120,
        },
      }),
    ).rejects.toThrow("Slot");

    expect(queryRaw).toHaveBeenCalledTimes(2);
    expect(String.raw(queryRaw.mock.calls[0][0] as TemplateStringsArray)).toContain(
      "pg_advisory_xact_lock",
    );
    const query = String.raw(queryRaw.mock.calls[1][0] as TemplateStringsArray);
    expect(query).toContain('"start_time" <');
    expect(query).toContain('"end_time" >');
    expect(create).not.toHaveBeenCalled();
  });

  it("creates bank-transfer reservations with an opaque reference and pending state", async () => {
    const queryRaw = vi.fn().mockResolvedValue([]);
    const create = vi
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ id: "new-booking", endTime: data.endTime }),
      );
    const transactionClient = {
      $queryRaw: queryRaw,
      booking: { create },
      bookingIdempotency: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (transaction: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
      ),
    } as unknown as PrismaClient;

    const booking = await createBookingWithLock({
      prisma,
      input: {
        serviceId: "service-1",
        customerName: "Customer",
        customerEmail: "customer@example.com",
        customerPhone: "555-0100",
        startTime: new Date("2030-01-01T11:30:00.000Z"),
        paymentMethod: "BANK_TRANSFER",
        serviceDurationMin: 60,
        bufferMinutes: 60,
        priceCents: 8000,
        downpaymentCents: 2000,
        maxBookingsPerDay: 8,
        dayStart: new Date("2030-01-01T00:00:00.000Z"),
        dayEnd: new Date("2030-01-02T00:00:00.000Z"),
        idempotencyKey: "b4c42c9c-5e9e-4c28-9c47-c3c2f9f84513",
        requestFingerprint: "new-booking-fingerprint",
        minimumLeadTimeMinutes: 120,
      },
    });

    expect(booking.bankTransferReference).toMatch(/^TF-2030-[A-F0-9]{12}$/);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        paymentMethod: "BANK_TRANSFER",
        paymentState: "PENDING_BANK_TRANSFER",
        bankTransferReference: booking.bankTransferReference,
      }),
    });
  });

  it("rejects a booking when the shared resource daily cap is reached", async () => {
    const queryRaw = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: 8 }]);
    const create = vi.fn();
    const transactionClient = {
      $queryRaw: queryRaw,
      booking: { create },
      bookingIdempotency: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (transaction: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
      ),
    } as unknown as PrismaClient;

    await expect(
      createBookingWithLock({
        prisma,
        input: {
          serviceId: "service-3",
          customerName: "Customer",
          customerEmail: "customer@example.com",
          customerPhone: "555-0100",
          startTime: new Date("2030-01-01T15:00:00.000Z"),
          paymentMethod: "BANK_TRANSFER",
          serviceDurationMin: 60,
          bufferMinutes: 60,
          priceCents: 8000,
          downpaymentCents: 2000,
          maxBookingsPerDay: 8,
          dayStart: new Date("2030-01-01T04:00:00.000Z"),
          dayEnd: new Date("2030-01-02T04:00:00.000Z"),
          idempotencyKey: "b4c42c9c-5e9e-4c28-9c47-c3c2f9f84514",
          requestFingerprint: "daily-cap-fingerprint",
          minimumLeadTimeMinutes: 120,
        },
      }),
    ).rejects.toThrow("Daily booking capacity reached");

    const capQuery = String.raw(queryRaw.mock.calls[2][0] as TemplateStringsArray);
    expect(capQuery).toContain("COUNT(*)");
    expect(capQuery).not.toContain('"service_id" =');
    expect(create).not.toHaveBeenCalled();
  });

  it("replays an identical idempotency key without creating a second booking", async () => {
    const idempotencyRecords = new Map<
      string,
      {
        requestFingerprint: string;
        booking: { id: string; endTime: Date; bankTransferReference: string };
      }
    >();
    const idempotencyFindUnique = vi.fn(({ where }) =>
      Promise.resolve(idempotencyRecords.get(where.idempotencyKey) ?? null),
    );
    const idempotencyCreate = vi.fn(({ data }) => {
      const record = {
        ...data,
        booking: {
          id: "booking-once",
          endTime: new Date("2030-01-01T12:30:00.000Z"),
          bankTransferReference: "TF-2030-ONCE",
        },
      };
      idempotencyRecords.set(data.idempotencyKey, record);
      return Promise.resolve(record);
    });
    const bookingCreate = vi.fn().mockResolvedValue({
      id: "booking-once",
      endTime: new Date("2030-01-01T12:30:00.000Z"),
      bankTransferReference: "TF-2030-ONCE",
    });
    const transactionClient = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      booking: { create: bookingCreate },
      bookingIdempotency: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: idempotencyFindUnique,
        create: idempotencyCreate,
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (transaction: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
      ),
    } as unknown as PrismaClient;
    const input = {
      serviceId: "service-1",
      customerName: "Customer",
      customerEmail: "customer@example.com",
      customerPhone: "555-0100",
      startTime: new Date("2030-01-01T11:30:00.000Z"),
      paymentMethod: "BANK_TRANSFER" as const,
      serviceDurationMin: 60,
      bufferMinutes: 60,
      priceCents: 8000,
      downpaymentCents: 2000,
      maxBookingsPerDay: 8,
      dayStart: new Date("2030-01-01T00:00:00.000Z"),
      dayEnd: new Date("2030-01-02T00:00:00.000Z"),
      idempotencyKey: "b4c42c9c-5e9e-4c28-9c47-c3c2f9f84501",
      requestFingerprint: "a".repeat(64),
      minimumLeadTimeMinutes: 120,
    };

    const first = await createBookingWithLock({ prisma, input });
    const replay = await createBookingWithLock({ prisma, input });

    expect(first.id).toBe("booking-once");
    expect(replay.id).toBe("booking-once");
    expect(replay.replayed).toBe(true);
    expect(bookingCreate).toHaveBeenCalledOnce();
    expect(idempotencyCreate).toHaveBeenCalledOnce();
  });

  it("rejects reuse of an idempotency key with a changed fingerprint", async () => {
    const existing = {
      requestFingerprint: "original-fingerprint",
      booking: { id: "original-booking", endTime: new Date("2030-01-01T12:30:00.000Z") },
    };
    const bookingCreate = vi.fn();
    const transactionClient = {
      $queryRaw: vi.fn().mockResolvedValueOnce([]),
      booking: { create: bookingCreate },
      bookingIdempotency: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: vi.fn().mockResolvedValue(existing),
        create: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (transaction: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
      ),
    } as unknown as PrismaClient;

    await expect(
      createBookingWithLock({
        prisma,
        input: {
          serviceId: "service-1",
          customerName: "Changed Customer",
          customerEmail: "changed@example.com",
          customerPhone: "555-0199",
          startTime: new Date("2030-01-01T11:30:00.000Z"),
          paymentMethod: "BANK_TRANSFER",
          serviceDurationMin: 60,
          bufferMinutes: 60,
          priceCents: 8000,
          downpaymentCents: 2000,
          maxBookingsPerDay: 8,
          dayStart: new Date("2030-01-01T00:00:00.000Z"),
          dayEnd: new Date("2030-01-02T00:00:00.000Z"),
          idempotencyKey: "b4c42c9c-5e9e-4c28-9c47-c3c2f9f84501",
          requestFingerprint: "changed-fingerprint",
          minimumLeadTimeMinutes: 120,
        },
      }),
    ).rejects.toThrow("different request");

    expect(bookingCreate).not.toHaveBeenCalled();
  });

  it("rejects a new reservation that violates the lead-time cutoff", async () => {
    const bookingCreate = vi.fn();
    const idempotencyCreate = vi.fn();
    const transactionClient = {
      $queryRaw: vi.fn().mockResolvedValueOnce([]),
      booking: { create: bookingCreate },
      bookingIdempotency: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: vi.fn().mockResolvedValue(null),
        create: idempotencyCreate,
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (transaction: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
      ),
    } as unknown as PrismaClient;

    await expect(
      createBookingWithLock({
        prisma,
        input: {
          serviceId: "service-1",
          customerName: "Customer",
          customerEmail: "customer@example.com",
          customerPhone: "555-0100",
          startTime: new Date(Date.now() + 60 * 60 * 1000),
          paymentMethod: "BANK_TRANSFER",
          serviceDurationMin: 60,
          bufferMinutes: 60,
          priceCents: 8000,
          downpaymentCents: 2000,
          maxBookingsPerDay: 8,
          dayStart: new Date(Date.now()),
          dayEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
          idempotencyKey: "b4c42c9c-5e9e-4c28-9c47-c3c2f9f84502",
          requestFingerprint: "request-fingerprint",
          minimumLeadTimeMinutes: 120,
        },
      }),
    ).rejects.toThrow("two hours in advance");

    expect(bookingCreate).not.toHaveBeenCalled();
    expect(idempotencyCreate).not.toHaveBeenCalled();
  });
});
