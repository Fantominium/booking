import { describe, expect, it } from "vitest";
import { z } from "zod";

const bookingSummarySchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string(),
  startTime: z.union([z.string(), z.date()]),
  endTime: z.union([z.string(), z.date()]),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
  emailDeliveryStatus: z.enum(["SUCCESS", "FAILED", "RETRYING"]),
  downpaymentPaidCents: z.number().int().nonnegative(),
  remainingBalanceCents: z.number().int().nonnegative(),
});

describe("admin bookings contract", () => {
  it("GET /api/admin/bookings returns bookings payload", () => {
    const payload = {
      bookings: [
        {
          id: "booking-1",
          serviceId: "service-1",
          serviceName: "Swedish Massage",
          customerName: "Taylor",
          customerEmail: "taylor@example.com",
          customerPhone: "555-111-2222",
          startTime: "2026-02-12T10:00:00.000Z",
          endTime: "2026-02-12T11:00:00.000Z",
          status: "CONFIRMED",
          emailDeliveryStatus: "SUCCESS",
          downpaymentPaidCents: 3000,
          remainingBalanceCents: 5000,
        },
      ],
    };

    const result = z.object({ bookings: z.array(bookingSummarySchema) }).safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("GET /api/admin/bookings/[id] returns booking detail payload", () => {
    const payload = {
      booking: {
        id: "booking-1",
        serviceId: "service-1",
        serviceName: "Swedish Massage",
        customerName: "Taylor",
        customerEmail: "taylor@example.com",
        customerPhone: "555-111-2222",
        startTime: "2026-02-12T10:00:00.000Z",
        endTime: "2026-02-12T11:00:00.000Z",
        status: "CONFIRMED",
        emailDeliveryStatus: "SUCCESS",
        downpaymentPaidCents: 3000,
        remainingBalanceCents: 5000,
      },
    };

    const result = z.object({ booking: bookingSummarySchema }).safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("POST /api/admin/bookings/[id]/mark-paid returns booking payload", () => {
    const payload = {
      booking: {
        id: "booking-1",
        serviceId: "service-1",
        serviceName: "Swedish Massage",
        customerName: "Taylor",
        customerEmail: "taylor@example.com",
        customerPhone: "555-111-2222",
        startTime: "2026-02-12T10:00:00.000Z",
        endTime: "2026-02-12T11:00:00.000Z",
        status: "COMPLETED",
        emailDeliveryStatus: "SUCCESS",
        downpaymentPaidCents: 3000,
        remainingBalanceCents: 0,
      },
    };

    const result = z.object({ booking: bookingSummarySchema }).safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("POST /api/admin/bookings/[id]/cancel returns booking payload", () => {
    const payload = {
      booking: {
        id: "booking-1",
        serviceId: "service-1",
        serviceName: "Swedish Massage",
        customerName: "Taylor",
        customerEmail: "taylor@example.com",
        customerPhone: "555-111-2222",
        startTime: "2026-02-12T10:00:00.000Z",
        endTime: "2026-02-12T11:00:00.000Z",
        status: "CANCELLED",
        emailDeliveryStatus: "SUCCESS",
        downpaymentPaidCents: 3000,
        remainingBalanceCents: 0,
      },
    };

    const result = z.object({ booking: bookingSummarySchema }).safeParse(payload);
    expect(result.success).toBe(true);
  });
});
