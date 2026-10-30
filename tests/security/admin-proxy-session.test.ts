import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getToken } = vi.hoisted(() => ({ getToken: vi.fn() }));
vi.mock("next-auth/jwt", () => ({ getToken }));

import { proxy } from "../../proxy";

// eslint-disable-next-line no-restricted-syntax -- framework request type is required by proxy()
const request = (path: string): NextRequest => new NextRequest(`http://localhost${path}`);

describe("admin proxy session handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["no session", () => getToken.mockResolvedValue(null)],
    ["expired or tampered session (decode failure)", () => getToken.mockRejectedValue(new Error("JWEExpired"))],
    ["non-admin role", () => getToken.mockResolvedValue({ role: "customer" })],
    ["role-less token", () => getToken.mockResolvedValue({ sub: "x" })],
  ])("redirects pages to login with the callback URL for %s", async (_name, arrange) => {
    arrange();

    const response = await proxy(request("/admin/bookings"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/admin/login");
    expect(location.searchParams.get("callbackUrl")).toBe("/admin/bookings");
  });

  it("returns 401 JSON for API calls without a valid admin session", async () => {
    getToken.mockResolvedValue(null);

    const response = await proxy(request("/api/admin/bookings"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  });

  it("keeps the login page reachable without a session so a user can recover", async () => {
    getToken.mockResolvedValue(null);

    const response = await proxy(request("/admin/login"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets a valid admin through with security headers applied", async () => {
    getToken.mockResolvedValue({ role: "admin", id: "admin-1" });

    const response = await proxy(request("/admin/services"));

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});
