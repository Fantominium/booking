import { z } from "zod";

const requiredSchema = z.object({
  DATABASE_URL: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM_ADDRESS: z.email(),
  NEXTAUTH_SECRET: z.string().min(1),
  IDEMPOTENCY_HMAC_SECRET: z.string().min(32),
  WEBHOOK_URL_TOKEN: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1),
  NEXT_PUBLIC_API_URL: z.string().optional(),
});

const optionalSchema = requiredSchema.partial();

const shouldSkipValidation =
  process.env.NODE_ENV === "test" || process.env.SKIP_ENV_VALIDATION === "1";

const schema = shouldSkipValidation ? optionalSchema : requiredSchema;

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  IDEMPOTENCY_HMAC_SECRET: process.env.IDEMPOTENCY_HMAC_SECRET,
  WEBHOOK_URL_TOKEN: process.env.WEBHOOK_URL_TOKEN,
  REDIS_URL: process.env.REDIS_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

export const isProd = process.env.NODE_ENV === "production";
