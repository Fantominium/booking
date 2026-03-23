# Quickstart: TruFlow Journey Hardening Remediation

## Purpose

Use this guide to validate the remediation feature locally against the current Next.js booking application with the least amount of setup churn.

## Prerequisites

1. Install dependencies:

```bash
pnpm install
```

1. Ensure the booking app environment variables are present in `bookings/.env`.

1. Start backing services and seed data when needed:

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma db seed
```

1. Start the app from the `bookings` directory:

```bash
pnpm dev
```

1. Run Storybook when working on header, modal, or payment-choice UI states:

```bash
pnpm storybook
```

## Phase 0 Audit Checklist

### Public Reachability Audit

1. Start from the homepage and every public booking CTA.
2. Verify the route reaches the service catalog or a supported direct booking route.
3. Verify the customer can select an offering, select a date/time, enter details, choose a payment path, and reach a final outcome.
4. Record dead ends, broken links, missing transitions, or silent failures in the audit matrix.

### Journey Variant Audit

1. Confirm how session, event, and rental are represented today.
2. Verify whether they are separate seeded offerings, separate routes, or require a small taxonomy extension.
3. Do not add a new domain model unless the audit proves the existing `Service` abstraction cannot support the required distinctions.

### Admin Reachability Audit

1. Verify direct access and in-app navigation for:
   - `/admin`
   - `/admin/services`
   - `/admin/bookings`
   - `/admin/availability` or the corresponding business-hours/date-override management routes
   - `/admin/admins`
2. Test as:
   - authenticated admin
   - unauthenticated user
   - stale or expired admin session
3. Confirm denial happens before protected content renders.

### Accessibility And Branding Audit

1. Inspect the header on mobile and desktop.
2. Open the hamburger menu with keyboard and pointer.
3. Verify focus enters the modal, escape closes it, and focus returns to the trigger.
4. Confirm the close control is a standard accessible X.
5. Confirm the approved TruFlow logo appears to the left of the title copy.
6. Check contrast and readability on booking and admin screens, not only the homepage.

## Implementation Validation Scenarios

### Customer Booking Completion

1. Run the main booking journey for each supported journey variant.
2. Verify the customer can reach the payment-choice step without dead ends.
3. Test both immediate payment and bank-transfer flows.
4. Verify the final state clearly communicates one of:
   - booking confirmed and paid
   - booking reserved/pending transfer
   - corrective action required

### Admin Workflow Completion

1. Log in as seeded admin.
2. Verify dashboard data loads.
3. Verify create/update/retire flows for services.
4. Verify business-hours and date-override workflows.
5. Verify booking follow-up actions, especially pending-payment visibility.

## Suggested Test Commands

### Baseline Quality Gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

### Focused Regression Runs

```bash
pnpm vitest run tests/integration/admin-auth.test.ts tests/integration/auth/admin-gate.test.ts tests/integration/booking.test.ts
pnpm vitest run tests/integration/components/Header.mobile.test.tsx tests/integration/components/Header.test.tsx
pnpm playwright test tests/e2e/booking-flow.spec.ts tests/e2e/navigation/admin-flow.spec.ts tests/e2e/navigation/customer-flow.spec.ts
```

### Accessibility Review

1. Run Storybook and inspect updated header/payment components.
2. Run Lighthouse accessibility review on the homepage, booking page, and admin dashboard.
3. Perform manual keyboard and focus checks for the modal navigation and payment-choice steps.

## Release Evidence Expected

Before the remediation is considered complete, capture:

1. Public route audit results showing no unresolved dead ends for session, event, and rental journeys.
2. Admin route audit results showing consistent authorization denial for unauthorized users.
3. Screens or notes proving the logo swap and modal close affordance.
4. Test evidence for BDD, E2E, integration, contract, and regression coverage additions.
5. Accessibility evidence for contrast, typography, focus handling, and keyboard operability.
