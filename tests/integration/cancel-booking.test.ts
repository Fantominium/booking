import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, updateMany, queueEmailJob, invalidateAvailabilityCache } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  queueEmailJob: vi.fn(),
  invalidateAvailabilityCache: vi.fn(),
}));

vi.mock("@/lib/services/email-outbox", () => ({
  enqueueOutboxEmail: queueEmailJob,
  dispatchEmailOutbox: vi.fn().mockResolvedValue({ dispatched: 0, failed: 0 }),
}));
vi.mock("@/lib/cache/availability", () => ({ invalidateAvailabilityCache }));

import { cancelBooking } from "@/lib/services/booking";

const booking = {
  id: "booking-1",
  status: "PENDING",
  paymentState: "PENDING_BANK_TRANSFER",
  customerEmail: "customer@example.com",
  service: { name: "Massage" },
};

const buildPrisma = (): never => {
  const client = {
    booking: { findUnique, updateMany },
    $transaction: (callback: (tx: unknown) => Promise<unknown>) => callback(client),
  };
  return client as never;
};

describe("booking cancellation transition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue(booking);
    updateMany.mockResolvedValue({ count: 1 });
    queueEmailJob.mockResolvedValue(undefined);
  });

  it("releases capacity and sends one cancellation notification", async () => {
    const prisma = buildPrisma();

    await cancelBooking({ prisma, bookingId: "booking-1" });

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "booking-1",
        status: "PENDING",
        paymentState: "PENDING_BANK_TRANSFER",
      },
      data: { status: "CANCELLED", remainingBalanceCents: 0 },
    });
    expect(queueEmailJob).toHaveBeenCalledOnce();
    expect(queueEmailJob).toHaveBeenCalledWith(expect.anything(), {
      bookingId: "booking-1",
      customerEmail: "customer@example.com",
      type: "CANCELLATION",
    });
    expect(invalidateAvailabilityCache).toHaveBeenCalledOnce();
  });

  it("does not notify or release twice if another transition wins", async () => {
    updateMany.mockResolvedValueOnce({ count: 0 });
    const prisma = buildPrisma();

    await expect(cancelBooking({ prisma, bookingId: "booking-1" })).rejects.toThrow(
      "Booking cannot be cancelled from its current state",
    );
    expect(queueEmailJob).not.toHaveBeenCalled();
    expect(invalidateAvailabilityCache).not.toHaveBeenCalled();
  });
});
