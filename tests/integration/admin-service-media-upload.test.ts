import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const getAdminSessionMock = vi.fn();
const createAdminUnauthorizedResponseMock = vi.fn();

vi.mock("@/lib/auth/admin", () => ({
  getAdminSession: getAdminSessionMock,
  createAdminUnauthorizedResponse: createAdminUnauthorizedResponseMock,
}));

const createUploadBlob = async (contents: string, mimeType: string): Promise<Blob> => {
  const response = new Response(contents, {
    headers: { "Content-Type": mimeType },
  });
  return response.blob();
};

const buildRequest = async (payload: {
  slot: "hero" | "heroPoster" | "card" | "invalid";
  file?: {
    name: string;
    contents: string;
    mimeType: string;
  };
  width?: string;
  height?: string;
  durationSeconds?: string;
}): Promise<Request> => {
  // eslint-disable-next-line no-restricted-syntax
  const formData = new FormData();
  formData.set("slot", payload.slot);
  if (payload.file) {
    const blob = await createUploadBlob(payload.file.contents, payload.file.mimeType);
    formData.set("file", blob, payload.file.name);
  }
  if (payload.width) {
    formData.set("width", payload.width);
  }
  if (payload.height) {
    formData.set("height", payload.height);
  }
  if (payload.durationSeconds) {
    formData.set("durationSeconds", payload.durationSeconds);
  }

  return new Request("http://localhost:3000/api/admin/services/media", {
    method: "POST",
    body: formData,
  });
};

describe("admin media upload route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    getAdminSessionMock.mockResolvedValue({ adminId: "admin-1" });
    createAdminUnauthorizedResponseMock.mockReturnValue(
      NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }),
    );
  });

  it("returns unauthorized response when admin session is missing", async () => {
    getAdminSessionMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/admin/services/media/route");

    const request = await buildRequest({
      slot: "hero",
      file: { name: "hero.jpg", contents: "abc", mimeType: "image/jpeg" },
      width: "1200",
      height: "800",
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("rejects uploads with invalid slot", async () => {
    const { POST } = await import("@/app/api/admin/services/media/route");

    const request = await buildRequest({
      slot: "invalid",
      file: { name: "hero.jpg", contents: "abc", mimeType: "image/jpeg" },
      width: "1200",
      height: "800",
    });

    const response = await POST(request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/invalid upload slot/i);
  });

  it("rejects video payloads beyond duration limit", async () => {
    const { POST } = await import("@/app/api/admin/services/media/route");

    const request = await buildRequest({
      slot: "hero",
      file: { name: "hero.mp4", contents: "video-bytes", mimeType: "video/mp4" },
      width: "1280",
      height: "720",
      durationSeconds: "120",
    });

    const response = await POST(request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/max duration/i);
  });

  it("accepts valid image upload and returns persisted metadata", async () => {
    const { POST } = await import("@/app/api/admin/services/media/route");

    const request = await buildRequest({
      slot: "card",
      file: { name: "card.jpg", contents: "image-bytes", mimeType: "image/jpeg" },
      width: "1200",
      height: "900",
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      url: string;
      mediaType: string;
      mimeType: string;
      bytes: number;
    };

    expect(response.status).toBe(200);
    expect(payload.mediaType).toBe("IMAGE");
    expect(payload.mimeType).toBe("image/jpeg");
    expect(payload.url).toMatch(/^\/uploads\/service-media\/card-[0-9a-f-]+\.jpg$/i);
    expect(payload.bytes).toBeGreaterThan(0);
  });

  it("rejects files with resolution above hard limit", async () => {
    const { POST } = await import("@/app/api/admin/services/media/route");

    const request = await buildRequest({
      slot: "card",
      file: { name: "card.jpg", contents: "image-bytes", mimeType: "image/jpeg" },
      width: "4000",
      height: "3000",
    });

    const response = await POST(request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/resolution exceeds/i);
  });
});
