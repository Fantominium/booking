# Local Development Bootstrap

## Purpose

This document defines the expected local development startup process for the current platform and establishes the documentation standard that future overhaul work must preserve and expand.

## Goals

- enable a new developer to run the app locally without tribal knowledge
- document the environment required for the web app, worker, database, and Redis
- clearly separate local/test-only credentials from production behavior
- provide startup verification and troubleshooting guidance

## Local Runtime Components

The local development environment currently requires:

- Next.js web app
- email worker process
- PostgreSQL database
- Redis
- test-mode payment and email configuration values

## Environment Variables

The local environment currently expects the keys listed in `.env` or a local override file.

Required values include:

- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `NEXTAUTH_SECRET`
- `WEBHOOK_URL_TOKEN`
- `REDIS_URL`
- `NEXT_PUBLIC_API_URL`

## Local/Test-Only Admin Credentials

The seeded local admin user is currently defined by the seed flow and is intended for local/test use only.

Current seeded credentials:

- Email: `admin@truflow.local`
- Password: `TestPassword123!`

Policy:

- these credentials are for local and automated test environments only
- they must never be used as a production bootstrap path
- production admin creation must use a separate secure process
- future overhaul work must preserve this separation explicitly in code and documentation

## Bootstrap Flow

Recommended startup sequence:

1. Install dependencies with `pnpm install`
2. Ensure PostgreSQL is available and the database exists
3. Ensure Redis is available
4. Configure local environment variables
5. Run Prisma validation and migrations
6. Seed local data
7. Start the Next.js application
8. Start the worker process
9. Verify the application and admin login paths

Containerized alternative:

1. Ensure Docker is available
2. Run `docker compose --env-file .env.compose.example up --build`
3. Wait for PostgreSQL, Redis, and the web app healthcheck to pass
4. Verify `http://localhost:3000/api/health`
5. Run migrations and seed data from the host or a one-off container if needed

## Verification Checklist

- home page loads
- booking flow loads
- admin login page loads
- seeded local admin can authenticate locally
- worker starts without connection failure
- database migrations complete successfully
- Redis is reachable by the worker and app where required

## Troubleshooting Topics That Must Be Covered

Future revisions of this document should maintain troubleshooting guidance for:

- missing or invalid environment variables
- PostgreSQL unavailable or incorrect database URL
- Redis unavailable
- Prisma migration failures
- failed local seed
- Stripe test-mode configuration issues
- webhook secret or webhook forwarding mismatch
- worker boot failures

## Future Overhaul Expectations

As the platform overhaul progresses, this document must be expanded to include:

- containerised local startup topology
- GitHub Actions parity expectations where relevant
- worker/service health verification steps
- any new backing services introduced by the overhaul
- updated environment creation steps for the generalized platform
