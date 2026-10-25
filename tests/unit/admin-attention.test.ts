import { describe, expect, it, vi } from "vitest";

import { getAdminAttentionItems } from "@/lib/services/admin-attention";

const row = (id: string): Record<string, unknown> => ({
  id,
  customerName: "Taylor",
  startTime: new Date("2030-01-01T14:00:00Z"),
  reviewGraceExpiresAt: id === "review" ? new Date("2030-01-01T10:00:00Z") : null,
  service: { name: "Massage" },
});

describe("admin attention items", () => {
  it("queries failed emails, transfers in review, and 7-day expiries, exposing only admin-safe fields", async () => {
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([row("failed")])
      .mockResolvedValueOnce([row("review")])
      .mockResolvedValueOnce([row("expired")]);
    const now = new Date("2030-02-10T00:00:00Z");

    const result = await getAdminAttentionItems({ booking: { findMany } } as never, now);

    expect(findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: { emailDeliveryStatus: "FAILED" } }));
    expect(findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { status: "PENDING", paymentState: "PENDING_BANK_TRANSFER_REVIEW" } }),
    );
    expect(findMany).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ where: { status: "EXPIRED", updatedAt: { gte: new Date("2030-02-03T00:00:00Z") } } }),
    );
    expect(result.transferReviews[0]).toEqual({
      id: "review",
      customerName: "Taylor",
      startTime: "2030-01-01T14:00:00.000Z",
      serviceName: "Massage",
      reviewGraceExpiresAt: "2030-01-01T10:00:00.000Z",
    });
    expect(Object.keys(result.emailFailures[0]).sort()).toEqual(
      ["customerName", "id", "reviewGraceExpiresAt", "serviceName", "startTime"],
    );
  });
});
