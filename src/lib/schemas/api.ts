import { z } from "zod";

const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
const emailSchema = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/i);
const dateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid datetime");

export const createBookingRequestSchema = z.object({
  serviceId: uuidSchema,
  startTime: dateTimeSchema,
  customerName: z.string().min(1).max(255),
  customerEmail: emailSchema,
  customerPhone: z.string().min(5).max(20),
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
