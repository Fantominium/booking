import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminSession, findUnique, markBookingAsPaid } = vi.hoisted(() => ({
  getAdminSession: vi.fn(),
  findUnique: vi.fn(),
  markBookingAsPaid: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  getAdminSession,
  createAdminUnauthorizedResponse: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: { booking: { findUnique } } }));
vi.mock("@/lib/services/booking", () => ({ markBookingAsPaid }));

import { POST } from "@/app/api/admin/bookings/[id]/mark-paid/route";

describe("admin bank-transfer reconciliation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminSession.mockResolvedValue({ user: { id: "admin-7", role: "admin" } });
    findUnique.mockResolvedValue({
      id: "booking-1",
      serviceId: "service-1",
      service: { name: "Massage" },
      customerName: "Customer",
      customerEmail: "customer@example.com",
      customerPhone: "555-0100",
      startTime: new Date("2030-01-01T13:00:00.000Z"),
      endTime: new Date("2030-01-01T15:00:00.000Z"),
      status: "PENDING",
      emailDeliveryStatus: "RETRYING",
      downpaymentPaidCents: 0,
      remainingBalanceCents: 6000,
    });
    markBookingAsPaid.mockResolvedValue({
      status: "CONFIRMED",
      paymentState: "DEPOSIT_PAID",
      downpaymentPaidCents: 2000,
      remainingBalanceCents: 6000,
    });
  });

  it("requires a verified amount and transfer reference", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifiedAmountCents: 2000 }),
      }),
      { params: Promise.resolve({ id: "booking-1" }) },
    );

    expect(response.status).toBe(400);
    expect(markBookingAsPaid).not.toHaveBeenCalled();
  });

  it("passes the admin identity and bank evidence to the atomic service", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifiedAmountCents: 2000, transferReference: "BANK-REF-1001" }),
      }),
      { params: Promise.resolve({ id: "booking-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(markBookingAsPaid).toHaveBeenCalledWith({
      prisma: expect.anything(),
      bookingId: "booking-1",
      verifiedAmountCents: 2000,
      transferReference: "BANK-REF-1001",
      verifiedByAdminId: "admin-7",
    });
    expect(payload.booking).toMatchObject({
      status: "CONFIRMED",
      paymentState: "DEPOSIT_PAID",
      downpaymentPaidCents: 2000,
      remainingBalanceCents: 6000,
    });
  });

  it("preserves safe domain validation status codes", async () => {
    markBookingAsPaid.mockRejectedValueOnce({
      code: "VALIDATION_ERROR",
      statusCode: 400,
      message: "Verified transfer exceeds the outstanding booking amount",
    });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifiedAmountCents: 9000, transferReference: "BANK-REF-1002" }),
      }),
      { params: Promise.resolve({ id: "booking-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Verified transfer exceeds the outstanding booking amount");
  });
});
