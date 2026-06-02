import { z } from "zod";

const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
const emailSchema = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/i);
const dateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid datetime");
const paymentMethodSchema = z.enum(["CARD", "BANK_TRANSFER"]);
const heroMediaTypeSchema = z.enum(["IMAGE", "VIDEO"]);
const cardMediaTypeSchema = z.enum(["IMAGE", "GIF"]);

const mediaUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.startsWith("/uploads/service-media/") || /^https?:\/\//i.test(value),
    "Invalid media URL",
  );

export const createBookingRequestSchema = z.object({
  serviceId: uuidSchema,
  startTime: dateTimeSchema,
  selectedDurationMin: z.number().int().positive().optional(),
  customerName: z.string().min(1).max(255),
  customerEmail: emailSchema,
  customerPhone: z.string().min(5).max(20),
  paymentMethod: paymentMethodSchema.default("CARD"),
});

export const createPaymentIntentRequestSchema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(3).default("usd"),
});

export const availabilityQuerySchema = z.object({
  serviceId: uuidSchema,
  startDate: z.string().regex(/\d{4}-\d{2}-\d{2}/),
  endDate: z
    .string()
    .regex(/\d{4}-\d{2}-\d{2}/)
    .optional(),
  date: z
    .string()
    .regex(/\d{4}-\d{2}-\d{2}/)
    .optional(),
});

export const customerDataDeletionRequestSchema = z.object({
  email: emailSchema,
});

export const customerDataDeletionConfirmSchema = z.object({
  token: z.string().min(20),
});

const durationPriceOptionSchema = z.object({
  durationMin: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
});

const serviceMediaMetadataShape = {
  heroMediaType: heroMediaTypeSchema.nullable().optional(),
  heroMediaUrl: mediaUrlSchema.nullable().optional(),
  heroMediaAltText: z.string().trim().max(255).nullable().optional(),
  heroPosterUrl: mediaUrlSchema.nullable().optional(),
  cardMediaType: cardMediaTypeSchema.nullable().optional(),
  cardMediaUrl: mediaUrlSchema.nullable().optional(),
  cardMediaAltText: z.string().trim().max(255).nullable().optional(),
  isDecorative: z.boolean().nullable().optional(),
};

export const serviceMediaMetadataSchema = z
  .object(serviceMediaMetadataShape)
  .superRefine((value, context) => {
    if (value.heroMediaUrl && !value.heroMediaType) {
      context.addIssue({
        code: "custom",
        path: ["heroMediaType"],
        message: "Hero media type is required when hero media is provided",
      });
    }

    if (value.cardMediaUrl && !value.cardMediaType) {
      context.addIssue({
        code: "custom",
        path: ["cardMediaType"],
        message: "Card media type is required when card media is provided",
      });
    }

    if (value.heroMediaType === "VIDEO" && value.heroMediaUrl && !value.heroPosterUrl) {
      context.addIssue({
        code: "custom",
        path: ["heroPosterUrl"],
        message: "Hero video requires a poster image",
      });
    }

    if (value.heroMediaUrl && value.isDecorative !== true && !value.heroMediaAltText) {
      context.addIssue({
        code: "custom",
        path: ["heroMediaAltText"],
        message: "Hero alt text is required unless media is decorative",
      });
    }

    if (value.cardMediaUrl && value.isDecorative !== true && !value.cardMediaAltText) {
      context.addIssue({
        code: "custom",
        path: ["cardMediaAltText"],
        message: "Card alt text is required unless media is decorative",
      });
    }
  });

const adminServiceBaseSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).nullable().optional(),
    offeringType: z.enum(["SESSION", "EVENT", "RENTAL"]).optional(),
    durationMin: z.number().int().positive().optional(),
    priceCents: z.number().int().nonnegative().optional(),
    downpaymentCents: z.number().int().nonnegative().optional(),
    durationPriceOptions: z.array(durationPriceOptionSchema).max(10).optional().nullable(),
    isActive: z.boolean().optional(),
    ...serviceMediaMetadataShape,
  })
  .superRefine((value, context) => {
    if (
      value.priceCents !== undefined &&
      value.downpaymentCents !== undefined &&
      value.downpaymentCents > value.priceCents
    ) {
      context.addIssue({
        code: "custom",
        path: ["downpaymentCents"],
        message: "Downpayment cannot exceed price",
      });
    }

    if (value.durationPriceOptions !== undefined && value.durationPriceOptions !== null) {
      if (value.durationPriceOptions.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["durationPriceOptions"],
          message: "At least one duration option is required",
        });
      }

      const uniqueDurations = new Set(
        value.durationPriceOptions.map((option) => option.durationMin),
      );
      if (uniqueDurations.size !== value.durationPriceOptions.length) {
        context.addIssue({
          code: "custom",
          path: ["durationPriceOptions"],
          message: "Duration options must be unique",
        });
      }
    }
  });

export const createAdminServiceRequestSchema = adminServiceBaseSchema.safeExtend({
  name: z.string().min(1).max(255),
  offeringType: z.enum(["SESSION", "EVENT", "RENTAL"]),
  durationMin: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
  downpaymentCents: z.number().int().nonnegative(),
  durationPriceOptions: z.array(durationPriceOptionSchema).max(10),
});

export const updateAdminServiceRequestSchema = adminServiceBaseSchema;
