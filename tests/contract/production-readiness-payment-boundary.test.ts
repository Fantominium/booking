import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createBookingWithLock,
  createPaymentIntent,
  serviceFindUnique,
  settingsFindFirst,
  mockedBusinessHoursFindMany,
} = vi.hoisted(() => ({
  createBookingWithLock: vi.fn(),
  createPaymentIntent: vi.fn(),
  serviceFindUnique: vi.fn(),
  settingsFindFirst: vi.fn(),
  mockedBusinessHoursFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    service: { findUnique: serviceFindUnique },
    systemSettings: { findFirst: settingsFindFirst },
    businessHours: { findMany: mockedBusinessHoursFindMany },
    dateOverride: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock("@/lib/services/booking", () => ({
  createBookingWithLock,
  attachPaymentIntent: vi.fn(),
}));

vi.mock("@/lib/services/payment", () => ({ createPaymentIntent }));

vi.mock("@/lib/middleware/rate-limit", () => ({
  publicRateLimitResponse: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/stripe/config", () => ({
  stripe: { webhooks: { constructEvent: vi.fn() } },
}));

import { POST as createBooking } from "@/app/api/bookings/route";
import { POST as createPaymentIntentRoute } from "@/app/api/payment-intents/route";
import { POST as stripeWebhook } from "@/app/api/webhooks/stripe/[token]/route";
import { GET as getServiceDetail } from "@/app/api/services/[serviceId]/route";
import { GET as getAvailability } from "@/app/api/availability/[serviceId]/route";

const serviceId = "123e4567-e89b-42d3-a456-426614174000";

const bookingRequest = (
  paymentMethod: "CARD" | "BANK_TRANSFER",
  startTime = "2030-01-01T10:00:00.000Z",
): Request =>
  new Request("http://localhost/api/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": "b4c42c9c-5e9e-4c28-9c47-c3c2f9f84501",
    },
    body: JSON.stringify({
      serviceId,
      startTime,
      selectedDurationMin: 60,
      customerName: "Taylor Customer",
      customerEmail: "taylor@example.com",
      customerPhone: "555-0100",
      paymentMethod,
    }),
  });

describe("production bank-transfer payment boundary", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXTAUTH_SECRET", "readiness-contract-test-secret");
    vi.stubEnv("IDEMPOTENCY_HMAC_SECRET", "readiness-idempotency-hmac-secret-32chars");
    mockedBusinessHoursFindMany.mockResolvedValue(
      Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        isOpen: true,
        openingTime: new Date("1970-01-01T00:00:00Z"),
        closingTime: new Date("1970-01-01T23:59:00Z"),
        blackoutRanges: [],
      })),
    );
    serviceFindUnique.mockResolvedValue({
      id: serviceId,
      offeringType: "EVENT",
      durationMin: 60,
      priceCents: 8000,
      downpaymentCents: 2000,
      isActive: true,
      durationPriceOptions: [{ durationMin: 60, priceCents: 8000 }],
    });
    settingsFindFirst.mockResolvedValue({
      bufferMinutes: 15,
      maxBookingsPerDay: 8,
      bankTransferInstructions: "Use the booking reference as the transfer memo.",
    });
    createBookingWithLock.mockResolvedValue({
      id: "booking-123",
      bankTransferReference: "TRU-BOOKING-123",
    });
    createPaymentIntent.mockResolvedValue({ id: "pi_test_123", clientSecret: "secret_test" });
  });

  it("Given a card request, When booking is submitted, Then it fails before any side effect", async () => {
    const response = await createBooking(bookingRequest("CARD"));

    expect(response.status).toBe(400);
    expect(createBookingWithLock).not.toHaveBeenCalled();
    expect(createPaymentIntent).not.toHaveBeenCalled();
  });

  it("Given no idempotency key, When booking is submitted, Then it fails before writing", async () => {
    const request = bookingRequest("BANK_TRANSFER");
    const headers = new Headers(request.headers);
    headers.delete("Idempotency-Key");
    const response = await createBooking(
      new Request(request.url, { method: request.method, headers, body: request.body }),
    );

    expect(response.status).toBe(400);
    expect(createBookingWithLock).not.toHaveBeenCalled();
  });

  it("Given an idempotency key, When booking is created, Then the key and fingerprint reach the transaction", async () => {
    await createBooking(bookingRequest("BANK_TRANSFER"));

    expect(createBookingWithLock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          idempotencyKey: "b4c42c9c-5e9e-4c28-9c47-c3c2f9f84501",
          requestFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
    );
  });

  it("Given a bank transfer request, When booking succeeds, Then it remains pending with instructions", async () => {
    const response = await createBooking(bookingRequest("BANK_TRANSFER"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      id: "booking-123",
      status: "PENDING",
      paymentMethod: "BANK_TRANSFER",
      paymentState: "PENDING_BANK_TRANSFER",
      bankTransferReference: "TRU-BOOKING-123",
      bankTransferInstructions: "Use the booking reference as the transfer memo.",
    });
    expect(createBookingWithLock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({ bufferMinutes: 60 }),
      }),
    );
    expect(createPaymentIntent).not.toHaveBeenCalled();
  });

  it("Given an inactive service, When booking is submitted, Then no reservation is created", async () => {
    serviceFindUnique.mockResolvedValueOnce({
      id: serviceId,
      isActive: false,
      offeringType: "EVENT",
      durationMin: 60,
      priceCents: 8000,
      downpaymentCents: 2000,
      durationPriceOptions: [{ durationMin: 60, priceCents: 8000 }],
    });

    const response = await createBooking(bookingRequest("BANK_TRANSFER"));

    expect(response.status).toBe(404);
    expect(createBookingWithLock).not.toHaveBeenCalled();
  });

  it("Given a start outside business hours, When booking is submitted, Then it is rejected before any write", async () => {
    mockedBusinessHoursFindMany.mockResolvedValueOnce([]);

    const response = await createBooking(bookingRequest("BANK_TRANSFER"));

    expect(response.status).toBe(400);
    expect(createBookingWithLock).not.toHaveBeenCalled();
  });

  it("Given a booking request, When the route delegates validation, Then it supplies the two-hour lead-time policy", async () => {
    const quarterHour = 15 * 60 * 1000;
    const startTime = new Date(
      Math.ceil((Date.now() + 60 * 60 * 1000) / quarterHour) * quarterHour,
    ).toISOString();
    await createBooking(bookingRequest("BANK_TRANSFER", startTime));

    expect(createBookingWithLock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({ minimumLeadTimeMinutes: 120 }),
      }),
    );
  });

  it("Given an inactive service, When detail or availability is requested, Then it is not exposed", async () => {
    serviceFindUnique.mockImplementation(async (query: { where: { isActive?: boolean } }) =>
      query.where.isActive ? null : { id: serviceId, isActive: false },
    );
    const context = { params: Promise.resolve({ serviceId }) };

    const detailResponse = await getServiceDetail(
      new Request(`http://localhost/api/services/${serviceId}`),
      context,
    );
    const availabilityResponse = await getAvailability(
      new Request(`http://localhost/api/availability/${serviceId}?startDate=2030-01-01`),
      context,
    );

    expect(detailResponse.status).toBe(404);
    expect(availabilityResponse.status).toBe(404);
  });

  it("Given a valid-shaped payment-intent request, When called, Then payment is unavailable", async () => {
    const response = await createPaymentIntentRoute();

    expect(response.status).toBe(503);
    expect(createPaymentIntent).not.toHaveBeenCalled();
  });

  it("Given any Stripe webhook request, When called, Then the route is unavailable", async () => {
    const response = await stripeWebhook();

    expect(response.status).toBe(503);
  });
});
