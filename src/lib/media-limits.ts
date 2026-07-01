export const MAX_IMAGE_UPLOAD_BYTES = 6 * 1024 * 1024;
export const MAX_GIF_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 15 * 1024 * 1024;

export const MAX_MEDIA_WIDTH = 2560;
export const MAX_MEDIA_HEIGHT = 1440;
export const MAX_VIDEO_DURATION_SECONDS = 45;

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const GIF_MIME_TYPES = ["image/gif"];
export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm"];

export const HERO_MEDIA_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES];
export const HERO_POSTER_MIME_TYPES = [...IMAGE_MIME_TYPES];
export const CARD_MEDIA_MIME_TYPES = [...IMAGE_MIME_TYPES, ...GIF_MIME_TYPES];
