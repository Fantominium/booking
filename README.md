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

Use .env.local for host development. The following keys are required by runtime validation:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/truflow_booking_dev
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
NEXTAUTH_SECRET=replace_with_generated_secret
WEBHOOK_URL_TOKEN=replace_with_generated_token
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Notes:

- Copy values from .env.local.example as your baseline.
- If you use local Docker defaults, set DATABASE_URL to postgresql://postgres:devpassword@localhost:5432/truflow_booking_dev?schema=public.
- Use test keys locally for Stripe and Resend.
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

Stop containers:

```bash
docker compose --env-file .env.compose.example down -v
```

## Common Commands

```bash
# Development
pnpm dev
pnpm worker:email

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
