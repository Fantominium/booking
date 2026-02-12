import { describe, expect, it } from "vitest";

import { createBookingRequestSchema } from "@/lib/schemas/api";

describe("email validation", () => {
  it("accepts valid emails", () => {
    const result = createBookingRequestSchema.safeParse({
      serviceId: "0f18b4e2-7c0a-4b43-9f4c-9a2b6d5c1f3c",
      startTime: new Date().toISOString(),
      customerName: "Jane Doe",
      customerEmail: "jane.doe@example.com",
      customerPhone: "5555555555",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid emails", () => {
    const result = createBookingRequestSchema.safeParse({
      serviceId: "0f18b4e2-7c0a-4b43-9f4c-9a2b6d5c1f3c",
      startTime: new Date().toISOString(),
      customerName: "Jane Doe",
      customerEmail: "not-an-email",
      customerPhone: "5555555555",
    });

    expect(result.success).toBe(false);
  });
});
