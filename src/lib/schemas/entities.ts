import { z } from "zod";

const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
const emailSchema = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/i);
const dateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid datetime");
const offeringTypeSchema = z.enum(["SESSION", "EVENT", "RENTAL"]);
const paymentMethodSchema = z.enum(["CARD", "BANK_TRANSFER"]);
const heroMediaTypeSchema = z.enum(["IMAGE", "VIDEO"]);
const cardMediaTypeSchema = z.enum(["IMAGE", "GIF"]);
const paymentStateSchema = z.enum([
  "UNPAID",
  "PENDING_BANK_TRANSFER",
  "DEPOSIT_PAID",
  "PAID_IN_FULL",
]);

const serviceDurationPriceOptionSchema = z.object({
  durationMin: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
});

const mediaUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.startsWith("/uploads/service-media/") || /^https?:\/\//i.test(value),
    "Invalid media URL",
  );

export const serviceSchema = z
  .object({
    id: uuidSchema,
    name: z.string().min(1).max(255),
    description: z.string().max(5000).nullable().optional(),
    offeringType: offeringTypeSchema,
    durationMin: z.number().int().positive(),
    priceCents: z.number().int().nonnegative(),
    downpaymentCents: z.number().int().nonnegative(),
    durationPriceOptions: z.array(serviceDurationPriceOptionSchema).nullable().optional(),
    heroMediaType: heroMediaTypeSchema.nullable().optional(),
    heroMediaUrl: mediaUrlSchema.nullable().optional(),
    heroMediaAltText: z.string().max(255).nullable().optional(),
    heroPosterUrl: mediaUrlSchema.nullable().optional(),
    cardMediaType: cardMediaTypeSchema.nullable().optional(),
    cardMediaUrl: mediaUrlSchema.nullable().optional(),
    cardMediaAltText: z.string().max(255).nullable().optional(),
    isDecorative: z.boolean().nullable().optional(),
    isActive: z.boolean(),
    createdAt: z.union([dateTimeSchema, z.date()]),
    updatedAt: z.union([dateTimeSchema, z.date()]),
  })
  .superRefine((value, context) => {
    if (value.heroMediaUrl && value.heroMediaType === "VIDEO" && !value.heroPosterUrl) {
      context.addIssue({
        code: "custom",
        path: ["heroPosterUrl"],
        message: "Poster is required for hero video",
      });
    }

    if (value.heroMediaUrl && value.isDecorative !== true && !value.heroMediaAltText) {
      context.addIssue({
        code: "custom",
        path: ["heroMediaAltText"],
        message: "Alt text is required for hero media",
      });
    }

    if (value.cardMediaUrl && value.isDecorative !== true && !value.cardMediaAltText) {
      context.addIssue({
        code: "custom",
        path: ["cardMediaAltText"],
        message: "Alt text is required for card media",
      });
    }
  });

export const bookingSchema = z.object({
  id: uuidSchema,
  serviceId: uuidSchema,
  customerName: z.string().min(1).max(255),
  customerEmail: emailSchema,
  customerPhone: z.string().min(5).max(20),
  startTime: z.union([dateTimeSchema, z.date()]),
  endTime: z.union([dateTimeSchema, z.date()]),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
  paymentMethod: paymentMethodSchema,
  paymentState: paymentStateSchema,
  emailDeliveryStatus: z.enum(["SUCCESS", "FAILED", "RETRYING"]),
  stripePaymentIntentId: z.string().nullable().optional(),
  stripeCustomerId: z.string().nullable().optional(),
  bankTransferReference: z.string().nullable().optional(),
  downpaymentPaidCents: z.number().int().nonnegative(),
  remainingBalanceCents: z.number().int().nonnegative(),
  createdAt: z.union([dateTimeSchema, z.date()]),
  updatedAt: z.union([dateTimeSchema, z.date()]),
});

export const businessHoursSchema = z.object({
  id: uuidSchema,
  dayOfWeek: z.number().int().min(0).max(6),
  openingTime: z.union([z.string(), z.date()]).nullable().optional(),
  closingTime: z.union([z.string(), z.date()]).nullable().optional(),
  isOpen: z.boolean(),
  blockedRanges: z
    .array(
      z.object({
        id: uuidSchema,
        startTime: z.union([z.string(), z.date()]),
        endTime: z.union([z.string(), z.date()]),
        reason: z.string().nullable().optional(),
      }),
    )
    .default([]),
});

export const dateOverrideSchema = z.object({
  id: uuidSchema,
  startDate: z.union([z.string(), z.date()]),
  endDate: z.union([z.string(), z.date()]),
  isBlocked: z.boolean(),
  customOpenTime: z.union([z.string(), z.date()]).nullable().optional(),
  customCloseTime: z.union([z.string(), z.date()]).nullable().optional(),
  reason: z.string().max(255).nullable().optional(),
});

export const systemSettingsSchema = z.object({
  id: uuidSchema,
  maxBookingsPerDay: z.number().int().min(1),
  bufferMinutes: z.number().int().min(0),
  bankTransferInstructions: z.string().nullable().optional(),
  updatedAt: z.union([dateTimeSchema, z.date()]),
});

export const paymentAuditLogSchema = z.object({
  id: uuidSchema,
  bookingId: uuidSchema,
  timestamp: z.union([dateTimeSchema, z.date()]),
  action: z.enum([
    "INTENT_CREATED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_FAILED",
    "REFUND_ISSUED",
    "REFUND_FAILED",
  ]),
  amountCents: z.number().int().nonnegative(),
  stripeEventId: z.string().nullable().optional(),
  stripePaymentIntentId: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  outcome: z.enum(["SUCCESS", "FAILED", "PENDING"]),
  errorMessage: z.string().nullable().optional(),
});

export const dataDeletionAuditLogSchema = z.object({
  id: uuidSchema,
  timestamp: z.union([dateTimeSchema, z.date()]),
  originalEmailHash: z.string().min(1),
  deletionReason: z.enum(["CUSTOMER_REQUEST", "AUTO_PURGE_AGE", "GDPR_RIGHT_TO_BE_FORGOTTEN"]),
  requestedByIp: z.string().nullable().optional(),
  status: z.enum(["SUCCESS", "FAILED", "PENDING"]),
});

export const adminSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  passwordHash: z.string().min(1),
  createdAt: z.union([dateTimeSchema, z.date()]),
  updatedAt: z.union([dateTimeSchema, z.date()]),
});
