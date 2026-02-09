# Development Quickstart: TruFlow Booking Platform

**Feature**: [001-truflow-booking](../spec.md)  
**Setup Date**: 2026-02-03  
**Stack**: Next.js + TypeScript + Tailwind + Prisma + PostgreSQL

---

## Prerequisites

- **Node.js**: v18+ (LTS)
- **pnpm**: v8+ (install via `npm install -g pnpm`)
- **PostgreSQL**: v14+ (local or Docker)
- **Docker** (optional, for containerized PostgreSQL)
- **Stripe Account**: Test account at https://dashboard.stripe.com/test/dashboard
- **Git**: For cloning and version control

---

## Quick Setup (5-10 minutes)

### 1. Clone Repository & Install Dependencies

```bash
cd /path/to/project
pnpm install
```

### 2. Setup PostgreSQL (Local or Docker)

**Option A: Local PostgreSQL**

```bash
# Create database
createdb truflow_booking_dev

# Set DATABASE_URL in .env.local
echo "DATABASE_URL=postgresql://localhost:5432/truflow_booking_dev" >> .env.local
```

**Option B: Docker PostgreSQL**

```bash
# Start PostgreSQL container
docker run -d \
  --name truflow-postgres \
  -e POSTGRES_DB=truflow_booking_dev \
  -e POSTGRES_PASSWORD=devpassword \
  -p 5432:5432 \
  postgres:15-alpine

# Set DATABASE_URL in .env.local
echo "DATABASE_URL=postgresql://postgres:devpassword@localhost:5432/truflow_booking_dev" >> .env.local
```

### 3. Setup Environment Variables

Create `.env.local` in project root:

```env
# Database
DATABASE_URL=postgresql://...  # Set above

# Stripe (Test Keys from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Email Service (Resend)
RESEND_API_KEY=re_...  # https://resend.com/api-keys

# Admin Authentication
NEXTAUTH_SECRET=$(openssl rand -base64 32)  # Generate random secret

# Webhook Security
WEBHOOK_URL_TOKEN=$(openssl rand -hex 32)  # Unguessable token for webhook endpoint

# Redis (for email queue)
REDIS_URL=redis://localhost:6379

# Optional: For Vercel deployments
NEXT_PUBLIC_API_URL=http://localhost:3000  # Local dev; use HTTPS URL in production
```

**Generate secrets:**

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# WEBHOOK_URL_TOKEN
openssl rand -hex 32
```

### 4. Setup Redis (for Email Queue)

**Option A: Local Redis**

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# or run in foreground
redis-server
```

**Option B: Docker Redis**

```bash
docker run -d \
  --name truflow-redis \
  -p 6379:6379 \
  redis:7-alpine
```

**Verify Redis is running:**

```bash
redis-cli ping
# Output: PONG
```

### 5. Initialize Database Schema

```bash
# Run Prisma migrations
pnpm prisma migrate dev --name init

# Seed initial data (services, business hours, settings)
pnpm prisma db seed
```

### 6. Start Development Server

```bash
# Terminal 1: Next.js app
pnpm dev

# Terminal 2: Email job queue worker (BullMQ)
pnpm worker:email

# App available at http://localhost:3000
```

---

## Accessing the Application

### Customer Booking Flow

1. **Service Catalog**: http://localhost:3000/book
2. **Select Service**: Choose "Deep Tissue Massage" (or any seeded service)
3. **Pick Date/Time**: Calendar shows available slots
4. **Guest Checkout**: Enter name, email, phone
5. **Payment (Stripe Test Card)**:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/26`)
   - CVC: `123`
   - ZIP: `12345`
6. **Success Page**: Displays booking details + ICS calendar attachment option

### Admin Panel

1. **Login**: http://localhost:3000/admin
2. **Default Credentials** (after seed):
   - Email: `admin@truflow.local`
   - Password: `TestPassword123!`
3. **Features**:
   - **Bookings**: View all bookings, filter by status, search by name
   - **Today's Schedule**: Quick view of today's appointments
   - **Pending Actions**: Unpaid balances, failed emails
   - **Availability**: Configure business hours, date overrides
   - **Services**: Create, edit, delete services
   - **Settings**: Max bookings/day, buffer time
   - **Admins**: Add/remove admin users, password resets

---

## Stripe Test Mode Setup

### 1. Get Stripe Test Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy `Secret Key` → `STRIPE_SECRET_KEY` in `.env.local`
3. Copy `Publishable Key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`

### 2. Setup Webhook Endpoint (Local Testing)

Use **Stripe CLI** to forward webhooks to local server:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Login to your Stripe account
stripe login

# Forward webhook events to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe/{WEBHOOK_URL_TOKEN}

# Output includes webhook signing secret
# Copy to STRIPE_WEBHOOK_SECRET in .env.local
```

### 3. Test Payment Flow

1. Navigate to booking flow
2. Use test card `4242 4242 4242 4242`
3. Check terminal 2 (email worker) for email queue logs
4. Verify webhook receives `payment_intent.succeeded` event

### 4. Simulate Payment Failures (Test Mode)

Use these card numbers to test failure scenarios:

| Card Number | Scenario |
|------------|----------|
| `4000 0000 0000 0002` | Payment declined (insufficient funds) |
| `4000 0000 0000 0127` | Requires authentication (3D Secure) |
| `5555 5555 5555 4444` | Generic decline |

---

## Email Queue Testing (BullMQ + Resend)

### Monitor Email Queue

```bash
# Terminal 3: BullMQ UI (optional, for visual queue monitoring)
pnpm bull-board

# Available at http://localhost:3001
```

### Test Email Delivery

1. Create a booking with valid email
2. Check terminal 2 (worker logs) for job processing:
   ```
   [email-queue] Processing CONFIRMATION email for booking abc123
   [email-queue] Email sent to customer@example.com
   [email-queue] Job completed
   ```
3. Verify email received (or check Resend dashboard for delivery status)

### Simulate Email Failure

In `.env.local`, set invalid Resend key to trigger retry queue:

```env
RESEND_API_KEY=re_invalid
```

Create a booking → Worker retries with backoff (1 min, 5 min, 15 min)

---

## Database Inspection

### Explore Database with Prisma Studio

```bash
pnpm prisma studio

# Opens http://localhost:5555
# Browse tables, edit records, run queries
```

### Manual SQL Queries

```bash
# Connect to PostgreSQL directly
psql truflow_booking_dev

# Example queries
SELECT * FROM services;
SELECT * FROM bookings WHERE status = 'CONFIRMED';
SELECT * FROM payment_audit_logs ORDER BY timestamp DESC LIMIT 10;
```

---

## Testing

### Run Test Suite

```bash
# Unit tests (Jest/Vitest)
pnpm test

# E2E tests (Playwright) - requires dev server running
pnpm test:e2e

# Watch mode
pnpm test:watch
```

### Test File Locations

- **Unit tests**: `src/**/*.test.ts`
- **E2E tests**: `e2e/**/*.spec.ts`
- **Storybook**: `src/**/*.stories.tsx`

### Build Storybook

```bash
pnpm storybook

# Builds component documentation
# Available at http://localhost:6006
```

---

## Troubleshooting

### "Cannot find module" Error

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### PostgreSQL Connection Failed

```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# If using Docker, verify container is running
docker ps | grep truffle-postgres
```

### Redis Connection Failed

```bash
# Verify Redis is running
redis-cli ping

# If using Docker
docker ps | grep truffle-redis
```

### Stripe Webhook Not Receiving Events

1. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
2. Check Stripe CLI is running and forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe/{TOKEN}
   ```
3. Verify webhook endpoint path matches: `/api/webhooks/stripe/{WEBHOOK_URL_TOKEN}`

### Email Not Sending

1. Verify `RESEND_API_KEY` is valid
2. Check email worker is running (Terminal 2)
3. Verify job queue in BullMQ UI (http://localhost:3001)
4. Check logs for retry attempts

---

## Seeding Data

### Default Seed Data

After `pnpm prisma db seed`, database includes:

**Services**:
- Deep Tissue Massage (60 min, $80, $20 down-payment)
- Swedish Massage (45 min, $60, $15 down-payment)
- Hot Stone Massage (75 min, $120, $30 down-payment)

**Business Hours**:
- Mon-Fri: 9 AM–5 PM
- Sat-Sun: Closed

**System Settings**:
- Max 8 bookings/day
- 15-minute buffer between appointments

**Admin User**:
- Email: `admin@truflow.local`
- Password: `TestPassword123!`

### Custom Seeding

Edit `prisma/seed.ts` to add more data:

```typescript
// Example: Add custom date override
await prisma.dateOverride.create({
  data: {
    date: new Date('2026-12-25'),
    isBlocked: true,
    reason: 'Christmas Holiday',
  }
})
```

Reseed:

```bash
pnpm prisma db seed
```

---

## Project Structure

```
truflow-booking/
├── app/
│   ├── api/
│   │   ├── bookings/
│   │   │   └── route.ts (POST /api/bookings)
│   │   ├── availability/
│   │   │   └── route.ts (GET /api/availability)
│   │   ├── webhooks/
│   │   │   └── stripe/[token]/route.ts
│   │   └── auth/
│   │       └── [...nextauth]/route.ts
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── bookings/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── book/
│   │   ├── page.tsx (Service catalog)
│   │   ├── [serviceId]/page.tsx (Calendar + checkout)
│   │   └── success/page.tsx
│   └── layout.tsx
├── lib/
│   ├── services/
│   │   ├── availability.ts (Slot calculation)
│   │   ├── booking.ts (Booking creation)
│   │   ├── payment.ts (Stripe integration)
│   │   └── email.ts (Resend integration)
│   ├── queue/
│   │   ├── email-queue.ts (BullMQ)
│   │   └── worker.ts (Job processor)
│   └── db/
│       └── client.ts (Prisma client)
├── components/
│   ├── service-card.tsx
│   ├── calendar-picker.tsx
│   ├── time-slot-picker.tsx
│   ├── checkout-form.tsx
│   └── admin/
│       ├── booking-table.tsx
│       ├── settings-form.tsx
│       └── dashboard.tsx
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│       └── 001_init.sql
├── spec/
│   └── openapi.yaml
├── e2e/
│   └── booking.spec.ts
├── .env.local (Git-ignored)
├── pnpm-lock.yaml
└── package.json
```

---

## Development Workflow

### Daily Development

```bash
# Terminal 1: Next.js dev server
pnpm dev

# Terminal 2: Email worker
pnpm worker:email

# Terminal 3: (Optional) Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe/{TOKEN}

# Terminal 4: (Optional) BullMQ UI
pnpm bull-board
```

### Testing a Feature

```bash
# 1. Write test first (TDD)
# 2. Run test to see failure
pnpm test --watch

# 3. Implement feature
# 4. Test passes
# 5. Manual verification in browser
# 6. Run full test suite
pnpm test

# 7. Check Storybook if UI component
pnpm storybook
```

### Before Committing

```bash
# Format code
pnpm format

# Lint
pnpm lint

# Test
pnpm test

# E2E test (if critical feature)
pnpm test:e2e

# Type check
pnpm typecheck
```

---

## Deployment

### Vercel Deployment

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push -u origin main
   ```

2. **Import in Vercel**:
   - Go to https://vercel.com/new
   - Import Git repository
   - Select project root: `bookings/`
   - Vercel detects Next.js

3. **Add Environment Variables**:
   - Paste all variables from `.env.local`
   - Use production Stripe keys (not test keys)
   - Generate new `NEXTAUTH_SECRET` and `WEBHOOK_URL_TOKEN`

4. **Deploy**:
   - Vercel runs `pnpm install` → `pnpm build` → deployment
   - Database migrations run on first deploy
   - Set Stripe webhook URL to production endpoint

---

## Next Steps

1. ✅ **Database**: Tables created, seeded with sample data
2. ✅ **API**: Routes scaffolded, ready for implementation
3. ✅ **Frontend**: Component stubs in Storybook
4. **Implementation**: Follow TDD approach per constitution (Phase 2)
5. **Testing**: Unit, integration, E2E tests added
6. **Deployment**: Vercel production-ready

---

## Support & Debugging

### Useful Commands

```bash
# View Prisma logs
DEBUG=prisma:* pnpm dev

# Check TypeScript errors
pnpm typecheck

# Audit dependencies for security
pnpm audit

# Update dependencies (carefully)
pnpm update

# Clean build
pnpm clean && pnpm build
```

### Resources

- **Prisma Docs**: https://www.prisma.io/docs/
- **Next.js Docs**: https://nextjs.org/docs
- **Stripe API**: https://stripe.com/docs/api
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs/

---

## Constitution Compliance Checklist

- ✅ TDD workflow enforced (tests written first)
- ✅ API-First: OpenAPI spec defined before implementation
- ✅ Type-safe: TypeScript strict mode enabled
- ✅ Mobile-first: Responsive design from 375px+
- ✅ Accessible: WCAG 2.2 AA compliance checklist
- ✅ Security: Payment security (Stripe), authentication (next-auth), audit logging
- ✅ Clean code: Convention-based file structure, semantic naming
- ✅ Minimal dependencies: Only essential packages included

**Setup complete!** 🚀 Start with [TDD Phase 2 tasks](../../../IMPL_PLAN.md#phase-2-core-logic-tdd-focus).
