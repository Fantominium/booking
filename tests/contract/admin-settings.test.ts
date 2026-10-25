import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const { getAdminSession, findFirst, update, create } = vi.hoisted(() => ({
  getAdminSession: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  getAdminSession,
  createAdminUnauthorizedResponse: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));
vi.mock("@/lib/cache/availability", () => ({ invalidateAvailabilityCache: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { systemSettings: { findFirst, update, create } },
}));

import { PATCH } from "@/app/api/admin/settings/route";

describe("admin settings contract", () => {
  const systemSettingsSchema = z.object({
    id: z.string(),
    maxBookingsPerDay: z.number().int().min(1),
    bufferMinutes: z.number().int().min(60),
    updatedAt: z.union([z.string(), z.date()]),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    getAdminSession.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
  });

  it("PATCH /api/admin/settings rejects a buffer below the product minimum", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bufferMinutes: 15 }),
      }),
    );

    expect(response.status).toBe(400);
    expect(findFirst).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("documents a settings payload with at least a 60-minute buffer", () => {
    const payload = {
      id: "b5f8f618-8b62-4a2e-a723-7b2a35d7e3f4",
      maxBookingsPerDay: 8,
      bufferMinutes: 60,
      updatedAt: "2026-02-10T12:00:00.000Z",
    };

    const result = systemSettingsSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
