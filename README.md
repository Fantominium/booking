# TruFlow Booking

TruFlow Booking is a Next.js application for customer booking journeys and admin operations, with a separate email worker backed by PostgreSQL and Redis.

## Stack

- Web app: Next.js + React + TypeScript
- Database: PostgreSQL + Prisma ORM
- Queue and worker: Redis + BullMQ email worker
- Test tools: Vitest and Playwright

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker Desktop (recommended for PostgreSQL and Redis)

## Quick Start (Local Host)

1. Install dependencies.

```bash
pnpm install
```

2. Create your local environment files.

```bash
cp .env.local.example .env.local
cp .env.local .env
```

3. Start PostgreSQL and Redis with Docker.

```bash
docker compose --env-file .env.compose.example up -d postgres redis
```

4. Run Prisma migrations.

```bash
pnpm exec prisma migrate dev
```

5. Seed local data (services, settings, local admin account).

```bash
pnpm exec prisma db seed
```

6. Start the web app.

```bash
pnpm dev
```

7. In a second terminal, start the email worker.

```bash
pnpm worker:email
```

8. Open http://localhost:3000.

## Environment Variables

Use .env.local for host development. These non-payment keys are required by production runtime validation:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/truflow_booking_dev
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS=bookings@example.test
NEXTAUTH_SECRET=replace_with_generated_secret
IDEMPOTENCY_HMAC_SECRET=separate_32_character_secret_stable_for_at_least_7_days
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Notes:

- Copy values from .env.local.example as your baseline.
- If you use local Docker defaults, set DATABASE_URL to postgresql://postgres:devpassword@localhost:5432/truflow_booking_dev?schema=public.
- Stripe configuration is intentionally not used or required for this bank-transfer-only release.
- Keep `IDEMPOTENCY_HMAC_SECRET` separate from the auth secret and stable for at least seven days; rotation invalidates retries within that retention window.
- Use test credentials for email delivery during local development.
- Do not commit .env files.

## Seeded Local Admin (Local/Test Only)

After running the seed command, a local admin account is available for development and automated tests only.

- Email: admin@truflow.local
- Password: TestPassword123!

This account must never be used as a production bootstrap path.

## Run All Applications Locally

The local development setup includes these processes:

- Web application on port 3000
- Email worker process
- Maintenance worker process (transfer expiry and privacy-token/audit cleanup)
- PostgreSQL on port 5432
- Redis on port 6379

To run everything:

1. Start PostgreSQL and Redis.
2. Run migrations and seed.
3. Start the web app.
4. Start the worker.

## Full Docker Runtime (Optional)

To start web, worker, PostgreSQL, and Redis in containers:

```bash
docker compose --env-file .env.compose.example up --build
```

Health check:

```bash
curl http://localhost:3000/api/health
```

`docker-compose.yml` is the production baseline: PostgreSQL and Redis publish no ports, sit on an internal-only network, Redis requires `REDIS_PASSWORD`, and every secret is a required variable. `docker-compose.override.yml` is loaded automatically for development and publishes the two services on `127.0.0.1` only. Deploy with `docker compose -f docker-compose.yml up -d` (explicit `-f` skips the override) and supply secrets from the deployment secret store, not `.env.compose.example`.

Stop containers:

```bash
docker compose --env-file .env.compose.example down -v
```

## Common Commands

```bash
# Development
pnpm dev
pnpm worker:email
pnpm worker:maintenance

# Quality
pnpm typecheck
pnpm lint

# Tests
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm test:e2e

# Storybook
pnpm storybook
pnpm build-storybook
```

## Verification Checklist

- Home page loads at http://localhost:3000
- Booking flow loads at http://localhost:3000/book?type=SESSION
- Admin login page loads at http://localhost:3000/admin/login
- Worker process starts without Redis or database connection errors
- Maintenance worker starts and registers recurring expiry/privacy jobs
- Prisma migrations and seed complete successfully

## Troubleshooting

- Missing environment variable errors:
  - Re-check .env.local against .env.local.example.
- Database connection errors:
  - Confirm PostgreSQL is running and DATABASE_URL is valid.
- Redis connection errors:
  - Confirm Redis is running and REDIS_URL points to localhost:6379.
- Migration or seed failures:
  - Re-run pnpm exec prisma migrate dev and pnpm exec prisma db seed after fixing DB connectivity.
- Port conflicts:
  - Stop processes using ports 3000, 5432, or 6379 and retry.

## Additional Docs

- Local bootstrap details: docs/overhaul/LOCAL_DEVELOPMENT_BOOTSTRAP.md
- Deployment: docs/deployment.md
- Contribution guide: CONTRIBUTING.md
