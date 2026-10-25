import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAdminSession,
  createAdminUnauthorizedResponse,
  adminFindMany,
  adminFindUnique,
  adminCreate,
  adminDelete,
} = vi.hoisted(() => ({
  getAdminSession: vi.fn(),
  createAdminUnauthorizedResponse: vi.fn(),
  adminFindMany: vi.fn(),
  adminFindUnique: vi.fn(),
  adminCreate: vi.fn(),
  adminDelete: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  getAdminSession,
  createAdminUnauthorizedResponse,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    admin: {
      findMany: adminFindMany,
      findUnique: adminFindUnique,
      create: adminCreate,
      delete: adminDelete,
      count: vi.fn(),
    },
  },
}));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn() }));

import { GET, POST } from "@/app/api/admin/admins/route";
import { DELETE } from "@/app/api/admin/admins/[id]/route";

describe("admin account route authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminSession.mockResolvedValue(null);
    createAdminUnauthorizedResponse.mockReturnValue(
      Response.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 }),
    );
  });

  it("denies list before reading admin accounts", async () => {
    const response = await GET();
    expect(response.status).toBe(401);
    expect(adminFindMany).not.toHaveBeenCalled();
  });

  it("denies create before parsing or writing admin accounts", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "new@example.com", password: "long-password" }),
      }),
    );
    expect(response.status).toBe(401);
    expect(adminFindUnique).not.toHaveBeenCalled();
    expect(adminCreate).not.toHaveBeenCalled();
  });

  it("denies delete before reading or deleting admin accounts", async () => {
    const response = await DELETE(new Request("http://localhost", { method: "DELETE" }), {
      params: Promise.resolve({ id: "admin-123" }),
    });
    expect(response.status).toBe(401);
    expect(adminFindUnique).not.toHaveBeenCalled();
    expect(adminDelete).not.toHaveBeenCalled();
  });
});
