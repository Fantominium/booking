# Production Deployment Guide

## Prerequisites

- A private Linux host or container platform capable of running the web app, email worker, PostgreSQL, and Redis
- PostgreSQL and Redis on private networking; use self-hosted services or a no-cost tier with restricted network access. Paid managed database services are not required for this release.
- A deployment secret store and TLS termination at the trusted ingress
- A verified Resend sender identity and API key
- A named database backup/restore operator and release approver

## Steps

1. Provision PostgreSQL and Redis on a private network. Do not publish database or Redis ports to the public Internet.
2. Build reviewed web and worker images. Run both as non-root and expose only the HTTPS ingress and required internal service ports.
3. Inject `DATABASE_URL`, `REDIS_URL`, `RESEND_API_KEY`, verified `EMAIL_FROM_ADDRESS`, `NEXTAUTH_SECRET`, and a separate `IDEMPOTENCY_HMAC_SECRET` (at least 32 characters) from the deployment secret store. Keep the idempotency secret stable for at least seven days when rotating it. Do not configure Stripe secrets for this release. Set `NEXT_PUBLIC_API_URL` to the canonical HTTPS application URL.
4. Back up the database and verify the backup before applying reviewed migrations with `pnpm exec prisma migrate deploy`. Never run `prisma db seed` in staging or production.
5. Deploy the web app and the separate email worker. Verify readiness, worker liveness, queue processing, sender verification, and the customer/admin smoke journeys.
6. Promote only after CI, security, accessibility, backup/restore, and named engineering, QA, security, product, and operations signoffs are attached to the release record.

The database URL must target a private PostgreSQL service. The default supported topology is self-hosted PostgreSQL and Redis on private infrastructure or a no-cost provider tier with strict network isolation. Development Compose credentials and ports are not production settings.

## Post-Deploy Checks

- Verify bank-transfer-only `/book` flow and pending transfer confirmation
- Verify PaymentIntent and Stripe webhook paths return unavailable
- Verify `/admin` authorization and one approved admin workflow
- Confirm the separate email worker is live and successfully processes a test message
- Verify readiness, structured log redaction, alert delivery, and rollback/forward-fix contact

## Worker Deployment

BullMQ workers run outside the Next.js runtime. Deploy the non-root email worker; it starts the maintenance worker in the same process. A standalone `pnpm worker:maintenance` command is available if operations deploys the two worker roles separately. The maintenance worker registers a five-minute transfer-expiry scan and hourly privacy maintenance (expired idempotency/reset/deletion tokens and one-year audit cleanup). The hourly job also anonymizes customer PII 24 months after the booking ends (approved retention, D9a); set `PII_PURGE_LEGAL_HOLD=true` to suspend this.

```bash
pnpm worker:email
pnpm worker:maintenance
```

## Backup, Restore, And Recovery

Production promotion is blocked until operators attach a successful PostgreSQL restore drill from an encrypted backup into an isolated target and record measured RPO/RTO against product-approved objectives. Review migrations before deploy. Prefer a forward-fix for applied production migrations; rollback only when the reviewed migration and data state make it safe. Record the exact migration, backup identifier, operator, timestamps, verification queries, and recovery outcome.

## Release Boundary

This release accepts bank transfer only. Stripe configuration, card collection, PaymentIntent creation, webhook processing, refunds, and live-payment checks are deferred to a separately approved specification. The disabled payment routes return `503` without loading Stripe.

## Network Exposure

- `docker-compose.yml` is the production baseline: PostgreSQL and Redis publish no host ports and sit on an `internal: true` network; Redis requires `REDIS_PASSWORD`; all secrets are required variables. Deploy with `docker compose -f docker-compose.yml up -d` (explicit `-f` skips `docker-compose.override.yml`).
- `docker-compose.override.yml` is development only and publishes both services on `127.0.0.1`. After changing port bindings, recreate the containers (`up -d --force-recreate`); existing containers keep their old bindings.
- Verify from another host that ports 5432 and 6379 are closed.

## Trusted Proxy Configuration

`TRUSTED_PROXY_HOPS` (default `1`) is the number of trusted entries at the right end of `X-Forwarded-For` that are not the client. The client IP is the entry immediately left of them, so `X-Forwarded-For: <spoofable...>, <client>, <ingress-peer>` with `TRUSTED_PROXY_HOPS=1` keys limits on `<client>`. If the header has too few entries the request is rejected with `503` (fail closed). Confirm the value in staging with a real request before enabling the 4-day rate-limit soak.

## Alerting

Operational alerts are emitted as single-line JSON on stderr (`{"event":"rate_limit_unavailable",...}`) and, when `ALERT_WEBHOOK_URL` (https only) is set, pushed to that webhook with a five-minute dedupe per event and job. Events:

| Event                      | Meaning                                                            | Source |
| -------------------------- | ------------------------------------------------------------------ | ------ |
| `rate_limit_unavailable`   | Redis unreachable; public routes are failing closed with 503       | web    |
| `pii_purge_failed`         | One or more customers could not be anonymized; job failed          | worker |
| `maintenance_job_failed`   | Any scheduled maintenance job failed                               | worker |
| `email_delivery_exhausted` | An email exhausted all retries                                     | worker |
| `outbox_dispatch_failed`   | Outbox rows could not be handed to the queue; retried every minute | worker |

Route the webhook to a monitored channel, and add a log-based rule on the same event names if logs are centralized. Delivery to a real channel must be proven in staging (T075).

## Privacy And Retention Settings

- `PII_PURGE_LEGAL_HOLD=true` suspends age-based customer anonymization (24 months after the booking ends). Unset it to resume.
- Dispatched email outbox rows are deleted after 7 days; expired one-time tokens and idempotency keys are deleted hourly.
