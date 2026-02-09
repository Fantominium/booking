import { z } from "zod";

const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
const emailSchema = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/i);
const dateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid datetime");

export const serviceSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(5000).nullable().optional(),
  durationMin: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
  downpaymentCents: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.union([dateTimeSchema, z.date()]),
  updatedAt: z.union([dateTimeSchema, z.date()]),
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
  stripePaymentIntentId: z.string().nullable().optional(),
  stripeCustomerId: z.string().nullable().optional(),
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
});

export const dateOverrideSchema = z.object({
  id: uuidSchema,
  date: z.union([z.string(), z.date()]),
  isBlocked: z.boolean(),
  customOpenTime: z.union([z.string(), z.date()]).nullable().optional(),
  customCloseTime: z.union([z.string(), z.date()]).nullable().optional(),
  reason: z.string().max(255).nullable().optional(),
});

export const systemSettingsSchema = z.object({
  id: uuidSchema,
  maxBookingsPerDay: z.number().int().min(1),
  bufferMinutes: z.number().int().min(0),
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
