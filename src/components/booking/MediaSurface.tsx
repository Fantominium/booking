"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type MediaType = "IMAGE" | "VIDEO" | "GIF";

type MediaSurfaceProps = {
  mediaType: MediaType | null | undefined;
  mediaUrl: string | null | undefined;
  altText?: string | null;
  posterUrl?: string | null;
  isDecorative?: boolean | null;
  className?: string;
  testId?: string;
};

const mediaPreferenceQuery = "(prefers-reduced-motion: reduce)";

export const MediaSurface = ({
  mediaType,
  mediaUrl,
  altText,
  posterUrl,
  isDecorative,
  className,
  testId,
}: MediaSurfaceProps): JSX.Element => {
  const [failedMediaKey, setFailedMediaKey] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isVideoInView, setIsVideoInView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaKey = `${mediaType ?? "none"}|${mediaUrl ?? "none"}|${posterUrl ?? "none"}`;
  const hasError = failedMediaKey === mediaKey;

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia(mediaPreferenceQuery);
    const handleChange = (): void => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (mediaType !== "VIDEO" || !mediaUrl) {
      return;
    }

    const videoElement = videoRef.current;
    if (!videoElement || !("IntersectionObserver" in globalThis)) {
      return;
    }

    // IntersectionObserver is the browser API that controls deferred media loading.
    // eslint-disable-next-line no-restricted-syntax
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVideoInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(videoElement);

    return () => observer.disconnect();
  }, [mediaKey, mediaType, mediaUrl]);

  const fallbackAlt = useMemo(() => {
    if (isDecorative) {
      return "";
    }
    return altText?.trim() || "Service media";
  }, [altText, isDecorative]);

  const handleMediaError = useCallback((): void => {
    setFailedMediaKey(mediaKey);
  }, [mediaKey]);

  if (!mediaType || !mediaUrl || hasError) {
    return (
      <div
        className={`media-placeholder-gradient ${className ?? ""}`.trim()}
        aria-hidden="true"
        data-testid={testId}
      />
    );
  }

  if (prefersReducedMotion && (mediaType === "VIDEO" || mediaType === "GIF")) {
    if (mediaType === "VIDEO" && posterUrl) {
      return (
        <Image
          src={posterUrl}
          alt={fallbackAlt}
          className={className}
          width={1920}
          height={1080}
          unoptimized
          onError={handleMediaError}
          data-testid={testId}
        />
      );
    }

    return (
      <div
        className={`media-placeholder-gradient ${className ?? ""}`.trim()}
        aria-hidden="true"
        data-testid={testId}
      />
    );
  }

  if (mediaType === "VIDEO") {
    const canObserveVideo = "IntersectionObserver" in globalThis;
    return (
      <video
        ref={videoRef}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        poster={posterUrl ?? undefined}
        onError={handleMediaError}
        data-testid={testId}
      >
        {isVideoInView || !canObserveVideo ? <source src={mediaUrl} /> : null}
      </video>
    );
  }

  return (
    <Image
      src={mediaUrl}
      alt={fallbackAlt}
      className={className}
      width={1920}
      height={1080}
      unoptimized
      onError={handleMediaError}
      data-testid={testId}
    />
  );
};
