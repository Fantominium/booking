# Deployment Guide (Vercel)

## Prerequisites

- Vercel account
- PostgreSQL database (e.g., Vercel Postgres, Supabase)
- Redis instance for BullMQ
- Stripe test or live keys
- Resend API key

## Steps

1. **Create a new Vercel project** and link this repository.
2. **Set environment variables** (see README for full list).
3. **Add build command**: `pnpm build`
4. **Add start command**: `pnpm start`
5. **Deploy**.

## Post-Deploy Checks

- Verify `/book` flow
- Verify `/admin` login
- Confirm Stripe webhook delivery
- Confirm email worker is running (separate process)

## Worker Deployment

BullMQ workers run outside the Next.js runtime. Deploy as a separate process (e.g., Vercel Cron + Serverless functions or a small container) using:

```bash
pnpm worker:email
```
