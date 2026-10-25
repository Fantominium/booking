import { beforeEach, describe, expect, it, vi } from "vitest";

const { bookingFindUnique, bookingUpdate, settingsFindFirst, send } = vi.hoisted(() => ({
  bookingFindUnique: vi.fn(),
  bookingUpdate: vi.fn(),
  settingsFindFirst: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: bookingFindUnique, update: bookingUpdate },
    systemSettings: { findFirst: settingsFindFirst },
  },
}));
vi.mock("@/lib/email/config", () => ({ resend: { emails: { send } } }));
vi.mock("@/lib/config/env", () => ({ env: { EMAIL_FROM_ADDRESS: "bookings@example.test" } }));
vi.mock("@/lib/email/templates/booking-cancellation", () => ({ BookingCancellationEmail: vi.fn() }));
vi.mock("@/lib/email/templates/booking-confirmation", () => ({ BookingConfirmationEmail: vi.fn() }));
vi.mock("@/lib/email/templates/booking-expiry", () => ({ BookingExpiryEmail: vi.fn() }));
vi.mock("@/lib/email/templates/refund-notification", () => ({ RefundNotificationEmail: vi.fn() }));

import { processEmailJob } from "@/workers/email-job-handler";

const job = (overrides: Record<string, unknown> = {}): never =>
  ({
    id: "booking-1:EXPIRY_NOTICE",
    name: "EXPIRY_NOTICE",
    data: { bookingId: "booking-1", customerEmail: "customer@example.com", type: "EXPIRY_NOTICE" },
    attemptsMade: 0,
    opts: { attempts: 3 },
    ...overrides,
  }) as never;

const statuses = (): string[] =>
  bookingUpdate.mock.calls.map((call) => (call[0] as { data: { emailDeliveryStatus: string } }).data.emailDeliveryStatus);

describe("email job handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bookingFindUnique.mockResolvedValue({
      id: "booking-1",
      customerName: "Taylor",
      startTime: new Date("2030-01-01T14:00:00Z"),
      endTime: new Date("2030-01-01T16:00:00Z"),
      createdAt: new Date("2029-12-30T00:00:00Z"),
      service: { name: "Massage" },
    });
    bookingUpdate.mockResolvedValue({});
    settingsFindFirst.mockResolvedValue({ bufferMinutes: 60 });
    send.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  it("sends with a deterministic provider idempotency key so retries cannot double-send", async () => {
    await processEmailJob(job());
    await processEmailJob(job({ attemptsMade: 1 }));

    const keys = send.mock.calls.map((call) => (call[1] as { idempotencyKey: string }).idempotencyKey);
    expect(keys).toEqual(["email/booking-1:EXPIRY_NOTICE", "email/booking-1:EXPIRY_NOTICE"]);
    expect(statuses().at(-1)).toBe("SUCCESS");
  });

  it("treats a provider error response as a failure and keeps the job retryable", async () => {
    send.mockResolvedValueOnce({ data: null, error: { name: "rate_limit_exceeded", message: "secret detail" } });

    await expect(processEmailJob(job())).rejects.toThrow("rate_limit_exceeded");

    expect(statuses().at(-1)).toBe("RETRYING");
    expect(statuses()).not.toContain("SUCCESS");
  });

  it("marks delivery FAILED once retries are exhausted", async () => {
    send.mockRejectedValueOnce(new Error("network"));

    await expect(processEmailJob(job({ attemptsMade: 2 }))).rejects.toThrow("network");

    expect(statuses().at(-1)).toBe("FAILED");
  });

  it("still retries safely when the status update fails after a successful send", async () => {
    bookingUpdate.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("db blip"));

    await expect(processEmailJob(job())).rejects.toThrow("db blip");
    await processEmailJob(job({ attemptsMade: 1 }));

    expect(send).toHaveBeenCalledTimes(2);
    expect(new Set(send.mock.calls.map((call) => (call[1] as { idempotencyKey: string }).idempotencyKey)).size).toBe(1);
  });
});
