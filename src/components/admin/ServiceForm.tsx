"use client";

import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod";

import {
  MAX_GIF_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_MEDIA_HEIGHT,
  MAX_MEDIA_WIDTH,
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_UPLOAD_BYTES,
} from "@/lib/media-limits";
import { getServiceDurationOptions } from "@/lib/service-duration-options";
import type { ServiceDurationPriceOption } from "@/types/service";

type HeroMediaType = "IMAGE" | "VIDEO";
type CardMediaType = "IMAGE" | "GIF";

type UploadSlot = "hero" | "heroPoster" | "card";

export type ServiceFormValues = {
  name: string;
  description: string;
  offeringType: "SESSION" | "EVENT" | "RENTAL";
  durationMin: number;
  priceCents: number;
  downpaymentCents: number;
  durationPriceOptions: ServiceDurationPriceOption[];
  heroMediaType: HeroMediaType | null;
  heroMediaUrl: string | null;
  heroMediaAltText: string;
  heroPosterUrl: string | null;
  cardMediaType: CardMediaType | null;
  cardMediaUrl: string | null;
  cardMediaAltText: string;
  isDecorative: boolean;
  isActive: boolean;
};

type ServiceFormProps = {
  initialValues: ServiceFormValues;
  onSubmit: (values: ServiceFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel: string;
  variant?: "modal" | "inline";
};

const serviceSchema: z.ZodTypeAny = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    offeringType: z.enum(["SESSION", "EVENT", "RENTAL"]),
    durationMin: z.number().int().positive("Duration must be greater than 0"),
    priceCents: z.number().int().nonnegative("Price is required"),
    downpaymentCents: z.number().int().nonnegative("Downpayment is required"),
    durationPriceOptions: z
      .array(
        z.object({
          durationMin: z.number().int().positive("Badge duration must be greater than 0"),
          priceCents: z.number().int().nonnegative("Badge price is required"),
        }),
      )
      .min(1, "Add at least one badge option"),
    heroMediaType: z.enum(["IMAGE", "VIDEO"]).nullable(),
    heroMediaUrl: z.string().nullable(),
    heroMediaAltText: z.string().max(255),
    heroPosterUrl: z.string().nullable(),
    cardMediaType: z.enum(["IMAGE", "GIF"]).nullable(),
    cardMediaUrl: z.string().nullable(),
    cardMediaAltText: z.string().max(255),
    isDecorative: z.boolean(),
    isActive: z.boolean(),
  })
  .refine((value) => value.downpaymentCents <= value.priceCents, {
    message: "Downpayment cannot exceed price",
    path: ["downpaymentCents"],
  })
  .refine(
    (value) =>
      new Set(value.durationPriceOptions.map((option) => option.durationMin)).size ===
      value.durationPriceOptions.length,
    {
      message: "Badge durations must be unique",
      path: ["durationPriceOptions"],
    },
  )
  .superRefine((value, context) => {
    if (value.heroMediaUrl && !value.heroMediaType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["heroMediaType"],
        message: "Hero media type is required",
      });
    }

    if (value.cardMediaUrl && !value.cardMediaType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cardMediaType"],
        message: "Card media type is required",
      });
    }

    if (value.heroMediaType === "VIDEO" && value.heroMediaUrl && !value.heroPosterUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["heroPosterUrl"],
        message: "Hero video requires a poster image",
      });
    }

    if (value.heroMediaUrl && !value.isDecorative && value.heroMediaAltText.trim().length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["heroMediaAltText"],
        message: "Hero alt text is required unless decorative",
      });
    }

    if (value.cardMediaUrl && !value.isDecorative && value.cardMediaAltText.trim().length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cardMediaAltText"],
        message: "Card alt text is required unless decorative",
      });
    }
  });

type UploadMetadata = {
  width: number;
  height: number;
  durationSeconds?: number;
};

type UploadMetadataHandlers = {
  onSuccess: (metadata: UploadMetadata) => void;
  onError: (message: string) => void;
};

const extractMetadata = (file: File, handlers: UploadMetadataHandlers): void => {
  if (file.type.startsWith("video/")) {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const cleanup = (): void => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };

    const handleLoadedMetadata = (): void => {
      handlers.onSuccess({
        width: video.videoWidth,
        height: video.videoHeight,
        durationSeconds: video.duration,
      });
      cleanup();
    };

    const handleVideoError = (): void => {
      handlers.onError("Unable to read video metadata");
      cleanup();
    };

    video.preload = "metadata";
    video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
    video.addEventListener("error", handleVideoError, { once: true });
    video.src = url;

    return;
  }

  void createImageBitmap(file)
    .then((bitmap) => {
      handlers.onSuccess({ width: bitmap.width, height: bitmap.height });
      bitmap.close();
    })
    .catch(() => {
      handlers.onError("Unable to read image metadata");
    });
};

const validateClientMediaLimits = (file: File, metadata: UploadMetadata): string | null => {
  if (metadata.width <= 0 || metadata.height <= 0) {
    return "Media resolution metadata is missing.";
  }

  if (metadata.width > MAX_MEDIA_WIDTH || metadata.height > MAX_MEDIA_HEIGHT) {
    return `Resolution exceeds ${MAX_MEDIA_WIDTH}x${MAX_MEDIA_HEIGHT}.`;
  }

  if (file.type.startsWith("video/")) {
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      return `Video exceeds ${Math.round(MAX_VIDEO_UPLOAD_BYTES / (1024 * 1024))}MB.`;
    }

    if (!metadata.durationSeconds || metadata.durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      return `Video duration must be <= ${MAX_VIDEO_DURATION_SECONDS} seconds.`;
    }

    return null;
  }

  if (file.type === "image/gif") {
    if (file.size > MAX_GIF_UPLOAD_BYTES) {
      return `GIF exceeds ${Math.round(MAX_GIF_UPLOAD_BYTES / (1024 * 1024))}MB.`;
    }
    return null;
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return `Image exceeds ${Math.round(MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024))}MB.`;
  }

  return null;
};

export const ServiceForm = ({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  variant = "modal",
}: ServiceFormProps): JSX.Element => {
  const [values, setValues] = useState<ServiceFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<UploadSlot | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const formClassName = useMemo(() => {
    return variant === "inline" ? "grid gap-3" : "grid gap-4";
  }, [variant]);

  const durationOptions = useMemo(() => {
    return getServiceDurationOptions(values);
  }, [values]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const target = event.target;
      const field = target.dataset.field as keyof ServiceFormValues | undefined;
      if (!field) {
        return;
      }

      const value =
        target instanceof HTMLInputElement && target.type === "checkbox"
          ? target.checked
          : target.value;

      setValues((prev) => ({
        ...prev,
        [field]:
          field === "durationMin" || field === "priceCents" || field === "downpaymentCents"
            ? Number(value)
            : value,
      }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      const input: Record<string, unknown> = {
        name: values.name,
        description: values.description,
        offeringType: values.offeringType,
        durationMin: values.durationMin,
        priceCents: values.priceCents,
        downpaymentCents: values.downpaymentCents,
        durationPriceOptions: values.durationPriceOptions,
        heroMediaType: values.heroMediaType,
        heroMediaUrl: values.heroMediaUrl,
        heroMediaAltText: values.heroMediaAltText,
        heroPosterUrl: values.heroPosterUrl,
        cardMediaType: values.cardMediaType,
        cardMediaUrl: values.cardMediaUrl,
        cardMediaAltText: values.cardMediaAltText,
        isDecorative: values.isDecorative,
        isActive: values.isActive,
      };

      try {
        serviceSchema.parse(input);
      } catch (validationError) {
        console.error(validationError);
        setError("Invalid service details");
        return;
      }

      setIsSaving(true);
      try {
        await onSubmit(values);
      } catch (submitError) {
        console.error(submitError);
        setError("Unable to save service.");
      } finally {
        setIsSaving(false);
      }
    },
    [onSubmit, values],
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleDurationPriceOptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const index = Number.parseInt(event.currentTarget.dataset.optionIndex ?? "", 10);
      const field = event.currentTarget.dataset.optionField;
      const rawValue = Number(event.currentTarget.value);

      if (Number.isNaN(index) || index < 0) {
        return;
      }

      if (field !== "durationMin" && field !== "priceCents") {
        return;
      }

      setValues((prev) => ({
        ...prev,
        durationPriceOptions: prev.durationPriceOptions.map((option, optionIndex) => {
          if (optionIndex !== index) {
            return option;
          }

          if (field === "durationMin") {
            return {
              ...option,
              durationMin: rawValue,
            };
          }

          return {
            ...option,
            priceCents: rawValue,
          };
        }),
      }));
    },
    [],
  );

  const handleAddDurationPriceOption = useCallback((): void => {
    setValues((prev) => ({
      ...prev,
      durationPriceOptions: [
        ...prev.durationPriceOptions,
        {
          durationMin: prev.durationMin,
          priceCents: prev.priceCents,
        },
      ],
    }));
  }, []);

  const uploadWithMetadata = useCallback(
    async (slot: UploadSlot, file: File, metadata: UploadMetadata): Promise<void> => {
      const limitError = validateClientMediaLimits(file, metadata);
      if (limitError) {
        setUploadError(limitError);
        setUploadingSlot(null);
        return;
      }

      // eslint-disable-next-line no-restricted-syntax
      const formData = new FormData();
      formData.set("slot", slot);
      formData.set("file", file);
      formData.set("width", String(metadata.width));
      formData.set("height", String(metadata.height));
      if (metadata.durationSeconds) {
        formData.set("durationSeconds", String(metadata.durationSeconds));
      }

      const response = await fetch("/api/admin/services/media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setUploadError(data.error ?? "Unable to upload media.");
        setUploadingSlot(null);
        return;
      }

      const data = (await response.json()) as {
        url: string;
        mediaType: HeroMediaType | CardMediaType;
      };

      setValues((prev) => {
        if (slot === "hero") {
          return {
            ...prev,
            heroMediaUrl: data.url,
            heroMediaType: data.mediaType as HeroMediaType,
          };
        }

        if (slot === "heroPoster") {
          return {
            ...prev,
            heroPosterUrl: data.url,
          };
        }

        return {
          ...prev,
          cardMediaUrl: data.url,
          cardMediaType: data.mediaType as CardMediaType,
        };
      });
      setUploadingSlot(null);
    },
    [],
  );

  const uploadFileForSlot = useCallback(
    (slot: UploadSlot, file: File): void => {
      setUploadError(null);
      setUploadingSlot(slot);

      extractMetadata(file, {
        onSuccess: (metadata) => {
          void uploadWithMetadata(slot, file, metadata).catch((uploadFailure) => {
            console.error(uploadFailure);
            setUploadError("Unable to upload media.");
            setUploadingSlot(null);
          });
        },
        onError: (message) => {
          setUploadError(message);
          setUploadingSlot(null);
        },
      });
    },
    [uploadWithMetadata],
  );

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const inputElement = event.currentTarget;
      const file = inputElement.files?.[0];
      const slot = inputElement.dataset.slot as UploadSlot | undefined;

      if (!file || !slot) {
        return;
      }

      uploadFileForSlot(slot, file);
      inputElement.value = "";
    },
    [uploadFileForSlot],
  );

  const clearMedia = useCallback((slot: UploadSlot): void => {
    setValues((prev) => {
      if (slot === "hero") {
        return {
          ...prev,
          heroMediaType: null,
          heroMediaUrl: null,
          heroMediaAltText: "",
          heroPosterUrl: null,
        };
      }

      if (slot === "heroPoster") {
        return {
          ...prev,
          heroPosterUrl: null,
        };
      }

      return {
        ...prev,
        cardMediaType: null,
        cardMediaUrl: null,
        cardMediaAltText: "",
      };
    });
  }, []);

  const handleClearMediaClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      const slot = event.currentTarget.dataset.slot as UploadSlot | undefined;
      if (!slot) {
        return;
      }

      clearMedia(slot);
    },
    [clearMedia],
  );

  const handleRemoveDurationPriceOption = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      const index = Number.parseInt(event.currentTarget.dataset.optionIndex ?? "", 10);
      if (Number.isNaN(index) || index < 0) {
        return;
      }

      setValues((prev) => {
        if (prev.durationPriceOptions.length <= 1) {
          return prev;
        }

        return {
          ...prev,
          durationPriceOptions: prev.durationPriceOptions.filter(
            (_option, optionIndex) => optionIndex !== index,
          ),
        };
      });
    },
    [],
  );

  return (
    <form className={formClassName} onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
        <span>Name</span>
        <input
          type="text"
          value={values.name}
          data-field="name"
          onChange={handleChange}
          className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
        <span>Description</span>
        <textarea
          value={values.description}
          data-field="description"
          onChange={handleChange}
          className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700"
          rows={3}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
        <span>Offering type</span>
        <select
          value={values.offeringType}
          data-field="offeringType"
          onChange={handleChange}
          className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700"
        >
          <option value="SESSION">Session</option>
          <option value="EVENT">Event</option>
          <option value="RENTAL">Rental</option>
        </select>
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
          <span>Duration (min)</span>
          <input
            type="number"
            value={values.durationMin}
            data-field="durationMin"
            onChange={handleChange}
            className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700"
            min={1}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
          <span>Price (cents)</span>
          <input
            type="number"
            value={values.priceCents}
            data-field="priceCents"
            onChange={handleChange}
            className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700"
            min={0}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
          <span>Downpayment (cents)</span>
          <input
            type="number"
            value={values.downpaymentCents}
            data-field="downpaymentCents"
            onChange={handleChange}
            className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700"
            min={0}
          />
        </label>
      </div>
      <div className="dark:bg-surface rounded-md border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700">
        <p className="text-xs font-semibold tracking-[0.08em] text-slate-700 uppercase dark:text-slate-200">
          Customer-facing duration badges
        </p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          Edit each badge duration and price shown on product cards.
        </p>
        <div className="mt-3 grid gap-2">
          {values.durationPriceOptions.map((option, index) => (
            <div
              key={`duration-price-option-${option.durationMin}-${option.priceCents}`}
              className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
            >
              <label className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
                <span>Duration (min)</span>
                <input
                  type="number"
                  min={1}
                  value={option.durationMin}
                  data-option-index={index}
                  data-option-field="durationMin"
                  onChange={handleDurationPriceOptionChange}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
                <span>Price (cents)</span>
                <input
                  type="number"
                  min={0}
                  value={option.priceCents}
                  data-option-index={index}
                  data-option-field="priceCents"
                  onChange={handleDurationPriceOptionChange}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  data-option-index={index}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  onClick={handleRemoveDurationPriceOption}
                  disabled={values.durationPriceOptions.length <= 1}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          onClick={handleAddDurationPriceOption}
        >
          Add badge
        </button>
        <div className="mt-3 flex flex-wrap gap-2">
          {durationOptions.map((option) => (
            <span
              key={`preview-${option.durationMin}`}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {option.durationMin} min · ${(option.priceCents / 100).toFixed(2)}
            </span>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={values.isActive}
          data-field="isActive"
          onChange={handleChange}
        />
        <span>Active</span>
      </label>
      <div className="dark:bg-surface rounded-md border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700">
        <p className="text-xs font-semibold tracking-[0.08em] text-slate-700 uppercase dark:text-slate-200">
          Media authoring (upload only)
        </p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          Upload hero and card media files. Direct URL entry is intentionally disabled for v1.
        </p>

        <label className="mt-3 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={values.isDecorative}
            data-field="isDecorative"
            onChange={handleChange}
          />
          <span>Media is decorative (alt text optional)</span>
        </label>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Hero media</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
              data-slot="hero"
              onChange={handleFileInput}
              disabled={uploadingSlot === "hero"}
              className="text-xs"
            />
            {values.heroMediaUrl ? (
              <button
                type="button"
                className="w-fit rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-100"
                data-slot="hero"
                onClick={handleClearMediaClick}
              >
                Remove hero media
              </button>
            ) : null}
            <label className="grid gap-1 text-xs text-slate-700 dark:text-slate-200">
              <span>Hero alt text</span>
              <input
                type="text"
                value={values.heroMediaAltText}
                data-field="heroMediaAltText"
                onChange={handleChange}
                disabled={values.isDecorative}
                className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700"
              />
            </label>
            {values.heroMediaType === "VIDEO" ? (
              <>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  data-slot="heroPoster"
                  onChange={handleFileInput}
                  disabled={uploadingSlot === "heroPoster"}
                  className="text-xs"
                />
                {values.heroPosterUrl ? (
                  <button
                    type="button"
                    className="w-fit rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-100"
                    data-slot="heroPoster"
                    onClick={handleClearMediaClick}
                  >
                    Remove poster
                  </button>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Card media</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              data-slot="card"
              onChange={handleFileInput}
              disabled={uploadingSlot === "card"}
              className="text-xs"
            />
            {values.cardMediaUrl ? (
              <button
                type="button"
                className="w-fit rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-100"
                data-slot="card"
                onClick={handleClearMediaClick}
              >
                Remove card media
              </button>
            ) : null}
            <label className="grid gap-1 text-xs text-slate-700 dark:text-slate-200">
              <span>Card alt text</span>
              <input
                type="text"
                value={values.cardMediaAltText}
                data-field="cardMediaAltText"
                onChange={handleChange}
                disabled={values.isDecorative}
                className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700"
              />
            </label>
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300">
          <p>
            Limits: images up to {Math.round(MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024))}MB, GIFs up to{" "}
            {Math.round(MAX_GIF_UPLOAD_BYTES / (1024 * 1024))}MB, videos up to{" "}
            {Math.round(MAX_VIDEO_UPLOAD_BYTES / (1024 * 1024))}MB and {MAX_VIDEO_DURATION_SECONDS}
            s.
          </p>
          <p>
            Resolution must be {MAX_MEDIA_WIDTH}x{MAX_MEDIA_HEIGHT} or smaller.
          </p>
          {values.heroMediaUrl ? <p>Hero: {values.heroMediaUrl}</p> : null}
          {values.heroPosterUrl ? <p>Hero poster: {values.heroPosterUrl}</p> : null}
          {values.cardMediaUrl ? <p>Card: {values.cardMediaUrl}</p> : null}
        </div>
      </div>
      {uploadError ? <p className="text-sm text-rose-600">{uploadError}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          disabled={isSaving}
        >
          {isSaving ? "Saving" : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            onClick={handleCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
};
