import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import {
  CARD_MEDIA_MIME_TYPES,
  GIF_MIME_TYPES,
  HERO_MEDIA_MIME_TYPES,
  HERO_POSTER_MIME_TYPES,
  MAX_GIF_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_MEDIA_HEIGHT,
  MAX_MEDIA_WIDTH,
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_UPLOAD_BYTES,
  VIDEO_MIME_TYPES,
} from "@/lib/media-limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type UploadSlot = "hero" | "heroPoster" | "card";

const UPLOAD_DIRECTORY = path.join(process.cwd(), "public", "uploads", "service-media");

const parsePositiveNumber = (value: FormDataEntryValue | null): number | null => {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const getAllowedMimeTypes = (slot: UploadSlot): string[] => {
  if (slot === "hero") {
    return HERO_MEDIA_MIME_TYPES;
  }
  if (slot === "heroPoster") {
    return HERO_POSTER_MIME_TYPES;
  }
  return CARD_MEDIA_MIME_TYPES;
};

const getMaxBytes = (mimeType: string): number => {
  if (VIDEO_MIME_TYPES.includes(mimeType)) {
    return MAX_VIDEO_UPLOAD_BYTES;
  }
  if (GIF_MIME_TYPES.includes(mimeType)) {
    return MAX_GIF_UPLOAD_BYTES;
  }
  return MAX_IMAGE_UPLOAD_BYTES;
};

const getMediaType = (slot: UploadSlot, mimeType: string): "IMAGE" | "VIDEO" | "GIF" => {
  if (slot === "hero" && VIDEO_MIME_TYPES.includes(mimeType)) {
    return "VIDEO";
  }
  if (slot === "card" && GIF_MIME_TYPES.includes(mimeType)) {
    return "GIF";
  }
  return "IMAGE";
};

const getExtensionFromFile = (file: File): string => {
  const getExpectedExtension = (): string => {
    if (file.type === "image/jpeg") {
      return "jpg";
    }
    if (file.type === "image/png") {
      return "png";
    }
    if (file.type === "image/webp") {
      return "webp";
    }
    if (file.type === "image/avif") {
      return "avif";
    }
    if (file.type === "image/gif") {
      return "gif";
    }
    if (file.type === "video/mp4") {
      return "mp4";
    }
    return "webm";
  };

  const isOriginalAllowed = (expectedExtension: string, originalExtension: string): boolean => {
    if (expectedExtension === "jpg") {
      return originalExtension === "jpg" || originalExtension === "jpeg";
    }

    return originalExtension === expectedExtension;
  };

  const original = file.name.split(".").pop()?.toLowerCase();
  const expectedExtension = getExpectedExtension();

  if (original && /^[a-z0-9]+$/i.test(original)) {
    if (isOriginalAllowed(expectedExtension, original)) {
      return original;
    }
  }

  return expectedExtension;
};

export const POST = async (request: Request): Promise<NextResponse> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse();
  }

  const formData = await request.formData();
  const slot = formData.get("slot");

  if (slot !== "hero" && slot !== "heroPoster" && slot !== "card") {
    return NextResponse.json({ error: "Invalid upload slot" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing upload file" }, { status: 400 });
  }

  const allowedMimeTypes = getAllowedMimeTypes(slot);
  if (!allowedMimeTypes.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported media type" }, { status: 400 });
  }

  const maxBytes = getMaxBytes(file.type);
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `Media exceeds max size of ${Math.round(maxBytes / (1024 * 1024))}MB` },
      { status: 400 },
    );
  }

  const width = parsePositiveNumber(formData.get("width"));
  const height = parsePositiveNumber(formData.get("height"));
  const durationSeconds = parsePositiveNumber(formData.get("durationSeconds"));

  if (!width || !height) {
    return NextResponse.json({ error: "Media resolution metadata is required" }, { status: 400 });
  }

  if (width > MAX_MEDIA_WIDTH || height > MAX_MEDIA_HEIGHT) {
    return NextResponse.json(
      {
        error: `Media resolution exceeds ${MAX_MEDIA_WIDTH}x${MAX_MEDIA_HEIGHT}`,
      },
      { status: 400 },
    );
  }

  const mediaType = getMediaType(slot, file.type);
  if (mediaType === "VIDEO") {
    if (!durationSeconds) {
      return NextResponse.json({ error: "Video duration metadata is required" }, { status: 400 });
    }

    if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      return NextResponse.json(
        { error: `Video exceeds max duration of ${MAX_VIDEO_DURATION_SECONDS} seconds` },
        { status: 400 },
      );
    }
  }

  await mkdir(UPLOAD_DIRECTORY, { recursive: true });

  const extension = getExtensionFromFile(file);
  const filename = `${slot}-${randomUUID()}.${extension}`;
  const fullPath = path.join(UPLOAD_DIRECTORY, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(fullPath, buffer);

  const url = `/uploads/service-media/${filename}`;

  return NextResponse.json({
    url,
    mediaType,
    mimeType: file.type,
    bytes: file.size,
    width,
    height,
    durationSeconds: durationSeconds ?? null,
  });
};
