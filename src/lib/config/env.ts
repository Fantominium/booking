import { z } from "zod";

const requiredSchema = z.object({
  DATABASE_URL: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  WEBHOOK_URL_TOKEN: z.string().min(1),
  REDIS_URL: z.string().min(1),
  NEXT_PUBLIC_API_URL: z.string().optional(),
});

const optionalSchema = requiredSchema.partial();

const schema = process.env.NODE_ENV === "test" ? optionalSchema : requiredSchema;

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  WEBHOOK_URL_TOKEN: process.env.WEBHOOK_URL_TOKEN,
  REDIS_URL: process.env.REDIS_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

export const isProd = process.env.NODE_ENV === "production";
