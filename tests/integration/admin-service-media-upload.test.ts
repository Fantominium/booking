import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

// ── Persistent mock handles for fs operations ────────────────────────────────
// vi.hoisted ensures these are created before any imports are resolved.
const { mkdirMock, writeFileMock } = vi.hoisted(() => ({
  mkdirMock: vi.fn().mockResolvedValue(undefined),
  writeFileMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/fs", () => ({
  mkdir: mkdirMock,
  writeFile: writeFileMock,
}));

// ── Auth mock (non-hoisted; set up per-test in beforeEach) ───────────────────
const getAdminSessionMock = vi.fn();
const createAdminUnauthorizedResponseMock = vi.fn();

vi.mock("@/lib/auth/admin", () => ({
  getAdminSession: getAdminSessionMock,
  createAdminUnauthorizedResponse: createAdminUnauthorizedResponseMock,
}));

/** Decode a base64 string into a Uint8Array backed by a fresh ArrayBuffer. */
const b64ToBytes = (b64: string): Uint8Array<ArrayBuffer> => {
  const binary = Buffer.from(b64, "base64");
  const result = new Uint8Array(binary.length);
  binary.copy(result);
  return result as Uint8Array<ArrayBuffer>;
};

// ── Well-known 1×1 black PNG (67 bytes) ──────────────────────────────────────
// Used in tests that exercise the sharp image-parsing path.
const TINY_PNG_BYTES = b64ToBytes(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==",
);

// ── Well-known 2×2 PNG – used for the oversized-dimension mock test ───────────
const TINY_2x2_PNG_BYTES = b64ToBytes(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAADklEQVQI12P4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==",
);

const createUploadBlob = (contents: Uint8Array<ArrayBuffer> | string, mimeType: string): Blob => {
  return new Blob([contents], { type: mimeType });
};

const buildRequest = (payload: {
  slot: "hero" | "heroPoster" | "card" | "invalid";
  file?: {
    name: string;
    contents: Uint8Array<ArrayBuffer> | string;
    mimeType: string;
  };
  width?: string;
  height?: string;
  durationSeconds?: string;
}): Request => {
  // eslint-disable-next-line no-restricted-syntax
  const formData = new FormData();
  formData.set("slot", payload.slot);
  if (payload.file) {
    const blob = createUploadBlob(payload.file.contents, payload.file.mimeType);
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
    // vi.doMock() registrations are NOT cleared by resetModules/clearAllMocks.
    // Ensure any per-test sharp mock from a previous test is removed before
    // the next test imports the route fresh.
    vi.doUnmock("sharp");

    getAdminSessionMock.mockResolvedValue({ adminId: "admin-1" });
    createAdminUnauthorizedResponseMock.mockReturnValue(
      NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }),
    );
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
  });

  it("returns unauthorized response when admin session is missing", async () => {
    getAdminSessionMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/admin/services/media/route");

    const request = buildRequest({
      slot: "hero",
      file: { name: "hero.png", contents: TINY_PNG_BYTES, mimeType: "image/png" },
      width: "1",
      height: "1",
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("rejects uploads with invalid slot", async () => {
    const { POST } = await import("@/app/api/admin/services/media/route");

    const request = buildRequest({
      slot: "invalid",
      file: { name: "hero.png", contents: TINY_PNG_BYTES, mimeType: "image/png" },
      width: "1",
      height: "1",
    });

    const response = await POST(request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/invalid upload slot/i);
  });

  it("rejects video payloads beyond duration limit", async () => {
    const { POST } = await import("@/app/api/admin/services/media/route");

    const request = buildRequest({
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

  it("accepts valid image upload and returns server-extracted dimensions", async () => {
    const { POST } = await import("@/app/api/admin/services/media/route");

    // Client sends bogus dimensions – server must use sharp-extracted ones (1×1).
    const request = buildRequest({
      slot: "card",
      file: { name: "card.png", contents: TINY_PNG_BYTES, mimeType: "image/png" },
      width: "999",
      height: "999",
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      url: string;
      mediaType: string;
      mimeType: string;
      bytes: number;
      width: number;
      height: number;
    };

    expect(response.status).toBe(200);
    expect(payload.mediaType).toBe("IMAGE");
    expect(payload.mimeType).toBe("image/png");
    expect(payload.url).toMatch(/^\/uploads\/service-media\/card-[0-9a-f-]+\.png$/i);
    expect(payload.bytes).toBeGreaterThan(0);
    // Server-extracted dimensions must override the client-provided bogus values.
    expect(payload.width).toBe(1);
    expect(payload.height).toBe(1);
  });

  it("rejects image whose actual dimensions exceed the hard limit", async () => {
    // Mock sharp BEFORE importing the route so the module sees the mock.
    vi.doMock("sharp", () => ({
      default: () => ({
        metadata: (): Promise<{ width: number; height: number }> =>
          Promise.resolve({ width: 3000, height: 2000 }),
      }),
    }));

    const { POST: POSTWithMock } = await import("@/app/api/admin/services/media/route");

    const request = buildRequest({
      slot: "card",
      file: { name: "big.png", contents: TINY_2x2_PNG_BYTES, mimeType: "image/png" },
      width: "3000",
      height: "2000",
    });

    const response = await POSTWithMock(request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/resolution exceeds/i);
  });

  it("returns 500 when the file cannot be written to disk", async () => {
    writeFileMock.mockRejectedValueOnce(new Error("ENOSPC: no space left on device"));

    const { POST: POSTWithMock } = await import("@/app/api/admin/services/media/route");

    const request = buildRequest({
      slot: "card",
      file: { name: "card.png", contents: TINY_PNG_BYTES, mimeType: "image/png" },
      width: "1",
      height: "1",
    });

    const response = await POSTWithMock(request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(payload.error).toMatch(/failed to store/i);
  });
});
