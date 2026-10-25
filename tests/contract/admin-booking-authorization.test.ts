import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAdminSession,
  createAdminUnauthorizedResponse,
  bookingFindUnique,
  cancelBooking,
  markBookingAsPaid,
  queueEmailJob,
} = vi.hoisted(() => ({
  getAdminSession: vi.fn(),
  createAdminUnauthorizedResponse: vi.fn(),
  bookingFindUnique: vi.fn(),
  cancelBooking: vi.fn(),
  markBookingAsPaid: vi.fn(),
  queueEmailJob: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  getAdminSession,
  createAdminUnauthorizedResponse,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { booking: { findUnique: bookingFindUnique } },
}));

vi.mock("@/lib/services/booking", () => ({ cancelBooking, markBookingAsPaid }));
vi.mock("@/lib/services/email", () => ({ queueEmailJob }));

import { GET as getBooking } from "@/app/api/admin/bookings/[id]/route";
import { POST as cancelBookingRoute } from "@/app/api/admin/bookings/[id]/cancel/route";
import { POST as markPaidRoute } from "@/app/api/admin/bookings/[id]/mark-paid/route";
import { POST as resendEmailRoute } from "@/app/api/admin/bookings/[id]/resend-email/route";

const context = { params: Promise.resolve({ id: "booking-123" }) };

describe("admin booking route authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminSession.mockResolvedValue(null);
    createAdminUnauthorizedResponse.mockReturnValue(
      Response.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 }),
    );
  });

  it.each([
    ["detail", () => getBooking(new Request("http://localhost"), context)],
    [
      "cancel",
      () => cancelBookingRoute(new Request("http://localhost", { method: "POST" }), context),
    ],
    [
      "mark paid",
      () => markPaidRoute(new Request("http://localhost", { method: "POST" }), context),
    ],
    [
      "resend email",
      () => resendEmailRoute(new Request("http://localhost", { method: "POST" }), context),
    ],
  ])("denies anonymous %s before reading or mutating booking data", async (_name, invoke) => {
    const response = await invoke();

    expect(response.status).toBe(401);
    expect(bookingFindUnique).not.toHaveBeenCalled();
    expect(cancelBooking).not.toHaveBeenCalled();
    expect(markBookingAsPaid).not.toHaveBeenCalled();
    expect(queueEmailJob).not.toHaveBeenCalled();
  });
});
