# Tasks: TruFlow Booking Platform

**Feature**: [001-truflow-booking](spec.md)  
**Generated**: 2026-02-09  
**Status**: Ready for Implementation

**Source Documents**:

- [plan.md](plan.md) - Technical stack and architecture decisions
- [spec.md](spec.md) - User stories with priorities (P1, P2, P3)
- [.specify/data-model.md](.specify/data-model.md) - 7 entities with relationships
- [.specify/contracts/openapi.yaml](.specify/contracts/openapi.yaml) - 28 API endpoints
- [.specify/research.md](.specify/research.md) - 11 technical decisions resolved
- [.specify/quickstart.md](.specify/quickstart.md) - Development environment setup

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: INCLUDED - Following the constitution's **NON-NEGOTIABLE TDD requirement**, all tests are written FIRST before implementation. Tests must FAIL initially, then pass after implementation.

---

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **Checkbox**: `- [ ]` for all tasks (markdown checkbox format)
- **[ID]**: Task identifier (T001, T002, etc.)
- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3, US4) - only for user story phases
- **File path**: Exact location included in description

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize Next.js project structure and core dependencies

- [x] T001 Create Next.js 14+ project with TypeScript, App Router, and Tailwind CSS
- [x] T002 Install and configure pnpm as package manager with workspace setup
- [x] T003 [P] Configure TypeScript strict mode and ESLint with security rules
- [x] T004 [P] Setup Prettier for code formatting with Tailwind plugin
- [x] T005 [P] Initialize Git repository with .gitignore for .env.local and node_modules
- [x] T006 [P] Setup Storybook for component documentation and development
- [x] T007 Install Prisma ORM and initialize with PostgreSQL provider
- [x] T008 [P] Install core dependencies: Zod, React Query, date-fns, React Hook Form
- [x] T009 [P] Install Stripe SDK (stripe) and Stripe.js (@stripe/stripe-js, @stripe/react-stripe-js)
- [x] T010 [P] Install BullMQ and Redis client for job queue
- [x] T011 [P] Install next-auth for authentication
- [x] T012 [P] Install Resend SDK for transactional email
- [x] T013 [P] Install ics package for calendar file generation
- [x] T014 [P] Setup MUI Base components library
- [x] T015 Create project directory structure: app/, components/, lib/, services/, types/
- [x] T016 [P] Create .env.local.example with all required environment variables documented
- [x] T017 [P] Setup GitHub Actions CI/CD workflow for linting and security scanning (npm audit, Snyk)
- [x] T017.5 [P] Configure ESLint rules to enforce functional programming patterns in .eslintrc.json: forbid `class` keyword, forbid `new` operator (with exceptions list for frameworks), forbid `this` binding patterns, enforce pure function pattern checks
- [x] T017.6 [P] Configure ESLint rules to enforce clean JSX patterns: forbid inline event handlers `onClick={() => ...}`, forbid `dangerouslySetInnerHTML`, enforce explicit TypeScript prop types, forbid anonymous functions in JSX props
- [x] T017.7 [P] Create pre-commit git hook (Husky) to run functional programming validation checks and prevent commits with class-based or unsafe JSX patterns

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema & Migrations

- [x] T018 Define Prisma schema for Service entity in prisma/schema.prisma
- [x] T019 [P] Define Prisma schema for Booking entity with unique composite index (serviceId, startTime)
- [x] T020 [P] Define Prisma schema for BusinessHours entity
- [x] T021 [P] Define Prisma schema for DateOverride entity
- [x] T022 [P] Define Prisma schema for SystemSettings entity (singleton)
- [x] T023 [P] Define Prisma schema for PaymentAuditLog entity
- [x] T024 [P] Define Prisma schema for DataDeletionAuditLog entity
- [x] T025 [P] Define Prisma schema for Admin entity (for next-auth)
- [x] T026 Run initial Prisma migration to create all tables with indexes
- [x] T027 Create database seed script in prisma/seed.ts for initial services, business hours, and system settings

### Authentication & Authorization

- [x] T028 Configure next-auth with CredentialsProvider for email/password in app/api/auth/[...nextauth]/route.ts
- [x] T029 [P] Create Admin model and database integration for next-auth
- [x] T030 [P] Implement bcrypt password hashing in lib/auth/password.ts
- [x] T031 [P] Create authentication middleware for admin routes in middleware.ts
- [x] T032 [P] Implement session management with HttpOnly, Secure, SameSite=Strict cookies

### Core Business Logic Services

- [x] T033 Create AvailabilityService in lib/services/availability.ts with slot calculation logic
- [x] T034 [P] Create BookingService in lib/services/booking.ts with atomic transaction and row-level locking
- [x] T035 [P] Create PaymentService in lib/services/payment.ts for Stripe PaymentIntent integration
- [x] T036 [P] Create EmailService in lib/services/email.ts with BullMQ job queue integration
- [x] T037 [P] Create IcsService in lib/services/ics.ts for calendar file generation

### Validation & Error Handling

- [x] T038 Define Zod schemas for all entities in lib/schemas/entities.ts
- [x] T039 [P] Define Zod schemas for API request/response payloads in lib/schemas/api.ts
- [x] T040 [P] Create error handling utilities in lib/errors.ts with sanitized error messages (FR-045)
- [x] T041 [P] Create API response formatters in lib/api/responses.ts

### Infrastructure Configuration

- [x] T042 Setup Redis connection and BullMQ queue initialization in lib/queue/config.ts
- [x] T043 [P] Configure Stripe client with API keys in lib/stripe/config.ts
- [x] T044 [P] Configure Resend email client in lib/email/config.ts
- [x] T045 [P] Create environment variable validation utility in lib/config/env.ts
- [x] T046 [P] Setup security headers (CSP, HSTS) in next.config.js (FR-048)
- [x] T047 [P] Implement rate limiting middleware in lib/middleware/rate-limit.ts (FR-043)

### Test Infrastructure Setup

- [x] T048 Setup Jest/Vitest test framework with TypeScript support
- [x] T049 [P] Configure Playwright for E2E testing
- [x] T050 [P] Create test database setup and teardown utilities in tests/setup/db.ts
- [x] T051 [P] Create Stripe mock/test fixtures in tests/fixtures/stripe.ts
- [x] T052 [P] Create test factories for entities in tests/factories/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Customer Books Massage Appointment (Priority: P1) 🎯 MVP

**Goal**: Enable customers to browse services, select date/time, provide contact details, pay down-payment via Stripe, and receive confirmation with calendar file.

**Why MVP**: This is the core revenue-generating flow. Without this working end-to-end, the business cannot accept bookings or collect payments.

**Independent Test**: Navigate through booking flow from service selection → date/time picker → checkout → Stripe payment → success page with calendar download. Verify booking appears in database with CONFIRMED status and confirmation email sent.

### Tests for Customer Service Catalog (TDD) 🧪

> **TDD**: Write these tests FIRST, ensure they FAIL before implementation

- [x] T052.5 [P] [US1] Unit test for email validation (Zod schema) in tests/unit/email-validation.test.ts: Verify valid emails accepted, invalid formats rejected
- [x] T053 [P] [US1] Contract test for GET /api/services in tests/contract/services.test.ts
- [x] T054 [P] [US1] Contract test for GET /api/services/[serviceId] in tests/contract/services.test.ts
- [x] T055 [P] [US1] Component test for ServiceCard in components/booking/ServiceCard.test.tsx

### Customer Service Catalog Implementation

- [x] T056 [P] [US1] Create Service model types in types/service.ts
- [x] T057 [P] [US1] Implement GET /api/services endpoint in app/api/services/route.ts
- [x] T058 [P] [US1] Implement GET /api/services/[serviceId] endpoint in app/api/services/[serviceId]/route.ts
- [x] T059 [US1] Create ServiceCard component in components/booking/ServiceCard.tsx with Storybook story
- [x] T060 [US1] Create ServiceCatalog page in app/book/page.tsx displaying all active services

### Tests for Availability Calculation (TDD) 🧪

> **TDD**: Write these tests FIRST - Critical business logic requiring comprehensive test coverage

- [x] T061 [P] [US1] Unit test for availability calculation with business hours in tests/unit/availability.test.ts
- [x] T062 [P] [US1] Unit test for availability with date overrides in tests/unit/availability.test.ts
- [x] T063 [P] [US1] Unit test for availability with buffer time logic in tests/unit/availability.test.ts
- [x] T064 [P] [US1] Unit test for availability with daily booking cap in tests/unit/availability.test.ts
- [x] T065 [P] [US1] Contract test for GET /api/availability/[serviceId] in tests/contract/availability.test.ts
- [x] T066 [P] [US1] Component test for DatePicker in components/booking/DatePicker.test.tsx
- [x] T067 [P] [US1] Component test for TimeSlotPicker in components/booking/TimeSlotPicker.test.tsx

### Availability Calculation & Display Implementation

- [x] T068 [P] [US1] Implement availability calculation logic in lib/services/availability.ts (business hours, date overrides, buffer time, daily cap)
- [x] T069 [P] [US1] Implement GET /api/availability/[serviceId] endpoint in app/api/availability/[serviceId]/route.ts
- [x] T070 [US1] Create DatePicker component in components/booking/DatePicker.tsx with unavailable dates grayed out
- [x] T071 [US1] Create TimeSlotPicker component in components/booking/TimeSlotPicker.tsx showing available times
- [x] T072 [US1] Create booking flow page in app/book/[serviceId]/page.tsx with date/time selection

### Tests for Guest Checkout & Payment (TDD) 🧪

> **TDD**: Write these tests FIRST - Critical payment flow with security implications

- [x] T073 [P] [US1] Unit test for booking validation (Zod schema) in tests/unit/booking-validation.test.ts
- [x] T074 [P] [US1] Integration test for atomic booking creation with row-level locking in tests/integration/booking.test.ts
- [x] T075 [P] [US1] Integration test for concurrent booking conflict detection in tests/integration/booking-conflict.test.ts
- [x] T076 [P] [US1] Integration test for automatic refund on conflict in tests/integration/payment-refund.test.ts
- [x] T077 [P] [US1] Contract test for POST /api/payment-intents in tests/contract/payment.test.ts
- [x] T078 [P] [US1] Contract test for POST /api/bookings in tests/contract/bookings.test.ts
- [x] T079 [P] [US1] Component test for CheckoutForm validation in components/booking/CheckoutForm.test.tsx

### Guest Checkout & Payment Implementation

- [x] T080 [P] [US1] Create Booking model types in types/booking.ts
- [x] T081 [P] [US1] Implement Stripe Elements integration in components/payment/StripePaymentForm.tsx
- [x] T082 [P] [US1] Create checkout form with guest details (name, email, phone) in components/booking/CheckoutForm.tsx
- [x] T083 [US1] Implement POST /api/payment-intents endpoint in app/api/payment-intents/route.ts to create PaymentIntent
- [x] T083.pre [P] [BLOCKING] Define abstract PaymentProvider interface in lib/services/payment-provider.interface.ts with methods: createPaymentIntent(amount, currency), confirmPayment(paymentIntentId), handleWebhook(event), refund(paymentIntentId, amount). Document each method with JSDoc (purpose, @param, @returns, @throws). Stripe class (T084) implements this interface. **Must complete before T084.**
- [x] T084 [US1] Implement POST /api/bookings endpoint in app/api/bookings/route.ts with atomic transaction and row-level locking (FR-004)
- [x] T085 [US1] Implement automatic refund on booking conflict in lib/services/payment.ts (FR-007b)
- [x] T085.5 [P] [US1] Implement refund SLA monitoring in lib/jobs/refund-sla-monitor.ts: Query PaymentAuditLog for REFUND_ISSUED events older than 5+ minutes without REFUND_COMPLETED status. If SLA exceeded, log alert with booking ID and refund amount for admin follow-up.

### Tests for Payment Confirmation & Webhooks (TDD) 🧪

> **TDD**: Write these tests FIRST - Security-critical webhook handling

- [x] T086 [P] [US1] Integration test for webhook signature verification in tests/integration/webhook.test.ts
- [x] T087 [P] [US1] Integration test for webhook with invalid signature (must reject) in tests/integration/webhook.test.ts
- [x] T088 [P] [US1] Integration test for idempotent webhook processing in tests/integration/webhook.test.ts
- [x] T089 [P] [US1] Integration test for payment_intent.succeeded event in tests/integration/webhook.test.ts
- [x] T090 [P] [US1] Integration test for payment_intent.payment_failed event in tests/integration/webhook.test.ts

### Payment Confirmation & Webhooks Implementation

- [x] T091 [P] [US1] Implement Stripe webhook handler in app/api/webhooks/stripe/[token]/route.ts with signature verification (FR-041)
- [x] T092 [P] [US1] Implement webhook event processing for payment_intent.succeeded in lib/services/booking.ts
- [x] T093 [P] [US1] Implement idempotency handling for webhook retries in lib/services/payment.ts
- [x] T094 [US1] Update booking status to CONFIRMED on successful payment in BookingService

### Tests for Email & Calendar Integration (TDD) 🧪

> **TDD**: Write these tests FIRST - Verify email delivery and ICS format

- [x] T095 [P] [US1] Unit test for ICS generation with valid RFC 5545 format in tests/unit/ics.test.ts
- [x] T096 [P] [US1] Integration test for email job queueing in tests/integration/email-queue.test.ts
- [x] T096.5 [P] [US1] Integration test for refund notification email queueing when automatic refund issued in tests/integration/refund-email.test.ts
- [x] T097 [P] [US1] Integration test for email worker retry logic (1, 5, 15 min) in tests/integration/email-worker.test.ts
- [x] T098 [P] [US1] Integration test for email delivery failure and admin alert in tests/integration/email-failure.test.ts

### Email & Calendar Integration Implementation

- [x] T099 [P] [US1] Create ICS calendar file generation in lib/services/ics.ts with booking details and 24-hour reminder
- [x] T100 [P] [US1] Create booking confirmation email template in lib/email/templates/booking-confirmation.tsx
- [x] T101 [P] [US1] Implement BullMQ email worker in workers/email-worker.ts with exponential backoff (1, 5, 15 min)
- [x] T102 [US1] Queue confirmation email job on booking confirmation in lib/services/booking.ts
- [x] T103 [US1] Create success page in app/book/success/page.tsx displaying booking details and ICS download

### Tests for Payment Audit Logging (TDD) 🧪

> **TDD**: Write these tests FIRST - Verify audit trail completeness

- [x] T104 [P] [US1] Integration test for audit log creation on all payment events in tests/integration/audit.test.ts
- [x] T105 [P] [US1] Integration test verifying no sensitive data in audit logs in tests/integration/audit-security.test.ts

### Payment Audit Logging Implementation

- [x] T106 [P] [US1] Implement payment audit logging in lib/services/audit.ts for all payment operations (FR-044)
- [x] T107 [US1] Log INTENT_CREATED, PAYMENT_CONFIRMED, PAYMENT_FAILED, REFUND_ISSUED events in PaymentAuditLog

### End-to-End Test for User Story 1 (TDD) 🧪

- [x] T108 [US1] E2E test for complete booking flow (service selection → payment → confirmation) in tests/e2e/booking-flow.spec.ts
- [x] T212 [US1] [P] Verify WCAG 2.2 Level AA contrast ratios for all text (SC-011)
- [x] T213 [US1] [P] Add semantic HTML and ARIA labels for screen reader accessibility (FR-033b)
- [x] T214 [US1] Run Lighthouse accessibility audit and achieve 100 score (SC-005)

**Checkpoint**: User Story 1 complete - Full customer booking flow functional with payment processing and email notifications

---

## Phase 4: User Story 2 - Admin Manages Business Availability (Priority: P2)

**Goal**: Enable business owner to configure operating hours by day of week and block specific dates for holidays or closures.

**Why P2**: Without availability management, the system cannot accurately calculate open slots. This is foundational for the booking engine but can initially use seeded default values, making customer booking (P1) possible first.

**Independent Test**: Login to admin panel → Navigate to Availability Management → Update Monday hours from 9 AM-5 PM to 10 AM-6 PM → Save → Verify customer calendar reflects new hours. Add date override for Christmas → Verify date becomes unavailable.

### Tests for Business Hours Configuration (TDD) 🧪

> **TDD**: Write these tests FIRST - Verify availability updates correctly

- [x] T109 [P] [US2] Contract test for GET /api/admin/business-hours in tests/contract/admin-availability.test.ts
- [x] T110 [P] [US2] Contract test for PUT /api/admin/business-hours in tests/contract/admin-availability.test.ts
- [x] T111 [P] [US2] Integration test for immediate availability refresh after hours change in tests/integration/availability-refresh.test.ts

### Business Hours Configuration Implementation

- [x] T112 [P] [US2] Create BusinessHours model types in types/availability.ts
- [x] T113 [P] [US2] Implement GET /api/admin/business-hours endpoint in app/api/admin/business-hours/route.ts
- [x] T114 [P] [US2] Implement PUT /api/admin/business-hours endpoint to update operating hours
- [x] T115 [US2] Create BusinessHoursForm component in components/admin/BusinessHoursForm.tsx for day-by-day configuration
- [x] T116 [US2] Create Availability Management page in app/admin/availability/page.tsx

### Tests for Date Overrides Configuration (TDD) 🧪

> **TDD**: Write these tests FIRST

- [x] T117 [P] [US2] Contract test for POST /api/admin/date-overrides in tests/contract/admin-availability.test.ts
- [x] T118 [P] [US2] Contract test for DELETE /api/admin/date-overrides/[id] in tests/contract/admin-availability.test.ts
- [x] T119 [P] [US2] Integration test for date override taking precedence over business hours in tests/integration/date-override.test.ts

### Date Overrides Configuration Implementation

- [x] T120 [P] [US2] Create DateOverride model types in types/availability.ts
- [x] T121 [P] [US2] Implement GET /api/admin/date-overrides endpoint in app/api/admin/date-overrides/route.ts
- [x] T122 [P] [US2] Implement POST /api/admin/date-overrides endpoint to create date override
- [x] T123 [P] [US2] Implement DELETE /api/admin/date-overrides/[id] endpoint to remove override
- [x] T124 [US2] Create DateOverrideForm component in components/admin/DateOverrideForm.tsx with reason field
- [x] T125 [US2] Add date override management section to Availability Management page

### Tests for System Settings Configuration (TDD) 🧪

> **TDD**: Write these tests FIRST

- [x] T126 [P] [US2] Contract test for PATCH /api/admin/settings in tests/contract/admin-settings.test.ts
- [x] T127 [P] [US2] Integration test for max bookings per day enforcement in tests/integration/booking-cap.test.ts
- [x] T128 [P] [US2] Integration test for buffer time calculation in tests/integration/buffer-time.test.ts

### System Settings Configuration Implementation

- [x] T129 [P] [US2] Create SystemSettings model types in types/settings.ts
- [x] T130 [P] [US2] Implement GET /api/admin/settings endpoint in app/api/admin/settings/route.ts
- [x] T131 [P] [US2] Implement PATCH /api/admin/settings endpoint to update max bookings per day and buffer time
- [x] T132 [US2] Create SystemSettingsForm component in components/admin/SystemSettingsForm.tsx
- [x] T133 [US2] Add system settings section to Availability Management page

### Immediate Availability Refresh

- [ ] T134 [US2] Implement cache invalidation for availability changes in lib/cache/availability.ts (FR-015)
- [ ] T135 [US2] Verify customer-facing calendar reflects changes immediately without restart

**Checkpoint**: User Story 2 complete - Admin can fully control business availability and settings

---

## Phase 5: User Story 3 - Admin Manages Bookings and Payments (Priority: P3)

**Goal**: Enable business owner to view bookings in filterable list, mark remaining balances as paid when customers pay in-person, and cancel bookings when necessary.

**Why P3**: This enables day-to-day operations management but isn't required for the initial booking flow to work. Can be implemented after core booking and availability management are stable.

**Independent Test**: Login to admin panel → Navigate to Booking Management → Filter by "Confirmed" status → Select booking with unpaid balance → Click "Mark Balance as Paid" → Verify status updates to COMPLETED. Cancel a booking → Verify time slot becomes available again and customer receives cancellation email.

### Tests for Admin Booking List & Dashboard (TDD) 🧪

> **TDD**: Write these tests FIRST

- [ ] T136 [P] [US3] Contract test for GET /api/admin/bookings with filters in tests/contract/admin-bookings.test.ts
- [ ] T137 [P] [US3] Contract test for GET /api/admin/dashboard/today in tests/contract/admin-dashboard.test.ts
- [ ] T138 [P] [US3] Integration test for authorization checks on admin endpoints in tests/integration/admin-auth.test.ts

### Admin Booking List & Dashboard Implementation

- [ ] T139 [P] [US3] Implement GET /api/admin/bookings endpoint with filtering (status, date range) in app/api/admin/bookings/route.ts
- [ ] T140 [P] [US3] Implement GET /api/admin/bookings/[id] endpoint for booking details in app/api/admin/bookings/[id]/route.ts
- [ ] T141 [P] [US3] Implement GET /api/admin/dashboard/today endpoint for today's schedule in app/api/admin/dashboard/today/route.ts
- [ ] T142 [P] [US3] Implement GET /api/admin/dashboard/pending-actions endpoint for unpaid balances and email failures in app/api/admin/dashboard/pending-actions/route.ts
- [ ] T143 [US3] Create BookingList component in components/admin/BookingList.tsx with MUI DataGrid for filtering and sorting
- [ ] T144 [US3] Create Dashboard page in app/admin/page.tsx with today's schedule and pending actions
- [ ] T145 [US3] Create Booking Management page in app/admin/bookings/page.tsx with filterable list

### Tests for Payment Status Management (TDD) 🧪

> **TDD**: Write these tests FIRST

- [ ] T146 [P] [US3] Contract test for POST /api/admin/bookings/[id]/mark-paid in tests/contract/admin-bookings.test.ts
- [ ] T147 [P] [US3] Integration test for marking booking as paid and updating status in tests/integration/mark-paid.test.ts

### Payment Status Management Implementation

- [ ] T148 [P] [US3] Implement POST /api/admin/bookings/[id]/mark-paid endpoint in app/api/admin/bookings/[id]/mark-paid/route.ts
- [ ] T149 [US3] Update booking status to COMPLETED and log payment completion in lib/services/booking.ts
- [ ] T150 [US3] Create MarkPaidButton component in components/admin/MarkPaidButton.tsx with confirmation dialog
- [ ] T151 [US3] Add payment status display to booking detail view

### Tests for Booking Cancellation (TDD) 🧪

> **TDD**: Write these tests FIRST

- [ ] T152 [P] [US3] Contract test for POST /api/admin/bookings/[id]/cancel in tests/contract/admin-bookings.test.ts
- [ ] T153 [P] [US3] Integration test for cancellation freeing time slot in tests/integration/cancel-booking.test.ts
- [ ] T154 [P] [US3] Integration test for cancellation email queueing in tests/integration/cancel-email.test.ts

### Booking Cancellation Implementation

- [ ] T155 [P] [US3] Implement POST /api/admin/bookings/[id]/cancel endpoint in app/api/admin/bookings/[id]/cancel/route.ts
- [ ] T156 [US3] Update booking status to CANCELLED and free time slot in lib/services/booking.ts
- [ ] T157 [US3] Create cancellation email template in lib/email/templates/booking-cancellation.tsx
- [ ] T158 [US3] Queue cancellation email job on booking cancellation
- [ ] T159 [US3] Create CancelBookingButton component in components/admin/CancelBookingButton.tsx with confirmation dialog

### Search & Filtering

- [ ] T160 [P] [US3] Implement debounced search by customer name/phone in BookingList component (FR-018a)
- [ ] T161 [US3] Add status filter dropdown to BookingList component (Pending, Confirmed, Completed, Cancelled)
- [ ] T162 [US3] Add date range filter to BookingList component

**Checkpoint**: User Story 3 complete - Admin can fully manage bookings, payments, and cancellations

---

## Phase 6: User Story 4 - Admin Configures Services (Priority: P3)

**Goal**: Enable business owner to add new massage services, update pricing or down-payment amounts, edit service descriptions, and remove discontinued services.

**Why P3**: Service configuration is essential but can start with seed data. The admin doesn't need to modify services immediately for customers to book. This can follow operational management features.

**Independent Test**: Login to admin panel → Navigate to Service Configuration → Click "Add Service" → Enter "Hot Stone Massage", 75 minutes, $120, $30 down-payment → Save → Verify service appears on customer catalog. Edit "Swedish Massage" price from $80 to $90 → Verify customer sees new price. Delete "Aromatherapy Session" → Verify removed from catalog but existing bookings intact.

### Tests for Service Management API (TDD) 🧪

> **TDD**: Write these tests FIRST

- [ ] T163 [P] [US4] Contract test for POST /api/admin/services in tests/contract/admin-services.test.ts
- [ ] T164 [P] [US4] Contract test for PATCH /api/admin/services/[id] in tests/contract/admin-services.test.ts
- [ ] T165 [P] [US4] Contract test for DELETE /api/admin/services/[id] in tests/contract/admin-services.test.ts
- [ ] T166 [P] [US4] Integration test preventing service deletion with future bookings in tests/integration/service-deletion.test.ts
- [ ] T167 [P] [US4] Unit test for service validation (downpayment <= price, duration > 0) in tests/unit/service-validation.test.ts

### Service Management API Implementation

- [ ] T168 [P] [US4] Implement POST /api/admin/services endpoint to create service in app/api/admin/services/route.ts
- [ ] T169 [P] [US4] Implement PATCH /api/admin/services/[id] endpoint to update service in app/api/admin/services/[id]/route.ts
- [ ] T170 [P] [US4] Implement DELETE /api/admin/services/[id] endpoint with validation for future bookings (FR-025) in app/api/admin/services/[id]/route.ts
- [ ] T171 [US4] Validate downpaymentCents <= priceCents and durationMin > 0 in service validation

### Service Configuration UI

- [ ] T172 [P] [US4] Create ServiceForm component in components/admin/ServiceForm.tsx with Zod validation
- [ ] T173 [P] [US4] Create ServiceList component in components/admin/ServiceList.tsx with edit/delete actions
- [ ] T174 [US4] Create Service Configuration page in app/admin/services/page.tsx
- [ ] T175 [US4] Add "Add Service" button and modal dialog to Service Configuration page
- [ ] T176 [US4] Implement inline editing for service details in ServiceList component

### Service Deletion Validation

- [ ] T177 [US4] Implement validation to prevent deletion of services with existing future bookings (FR-025)
- [ ] T178 [US4] Display error message when attempting to delete service with future bookings
- [ ] T179 [US4] Add "Mark Inactive" option as alternative to deletion for services with bookings

**Checkpoint**: User Story 4 complete - Admin can fully manage service catalog

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final production readiness

### Admin Authentication & User Management

- [ ] T180 [P] Create admin login page in app/admin/login/page.tsx
- [ ] T181 [P] Implement password reset flow with email token in app/api/auth/password-reset/route.ts
- [ ] T182 [P] Create password reset email template in lib/email/templates/password-reset.tsx
- [ ] T183 [P] Implement GET /api/admin/admins endpoint to list admins in app/api/admin/admins/route.ts
- [ ] T184 [P] Implement POST /api/admin/admins endpoint to add admin user in app/api/admin/admins/route.ts
- [ ] T185 [P] Implement DELETE /api/admin/admins/[id] endpoint to remove admin in app/api/admin/admins/[id]/route.ts
- [ ] T186 Create Manage Admins page in app/admin/admins/page.tsx

### Customer Data Privacy & Deletion

- [ ] T187 [P] Implement POST /api/customer-data/request-deletion endpoint in app/api/customer-data/request-deletion/route.ts
- [ ] T188 [P] Implement POST /api/customer-data/confirm-deletion endpoint with token verification in app/api/customer-data/confirm-deletion/route.ts
- [ ] T189 [P] Create deletion request email template with verification token in lib/email/templates/deletion-request.tsx
- [ ] T190 [P] Implement PII anonymization logic in lib/services/data-deletion.ts (FR-052)
- [ ] T191 [P] Log all deletions in DataDeletionAuditLog with email hash and reason
- [ ] T192 Create scheduled job for automatic PII purge (2-year threshold) in jobs/pii-purge.ts (FR-051)

### Email Delivery Monitoring

- [ ] T193 [P] Add email delivery status tracking to Booking entity (SUCCESS, FAILED, RETRYING)
- [ ] T194 [P] Display email delivery status in admin booking detail view
- [ ] T195 [P] Implement manual email resend action in admin panel
- [ ] T196 Create refund notification email template in lib/email/templates/refund-notification.tsx

### Additional Email & Payment Monitoring

- [ ] T096.5 [P] Integration test for refund notification email queueing when refund issued in tests/integration/refund-email.test.ts
- [ ] T085.5 [P] Implement refund SLA monitoring task in lib/jobs/refund-sla-monitor.ts: Query PaymentAuditLog for REFUND_ISSUED events older than 5 minutes without completion status; log alert if SLA exceeded

### Functional Programming & Clean JSX Validation (NON-NEGOTIABLE)

> **Code Architecture Review**: Validate entire codebase conforms to functional programming and clean JSX standards (FR-055-FR-068)

- [ ] T203.5 [P] Audit all React components for class-based patterns: grep codebase for `class Component`, `extends React.Component`, `new ClassName()` instances; document any found and refactor to functional components (FR-056)
- [ ] T203.6 [P] Audit all service functions for pure function compliance: verify no global state mutations, no `this` binding, no side effects outside return values (FR-057)
- [ ] T203.7 [P] Audit all data mutations for immutability: verify all data updates use spread operators, `.map()`, `.filter()`, `.reduce()` instead of `.push()`, `.splice()`, `obj.prop =` assignments (FR-058)
- [ ] T203.8 [P] Audit all React components for inline event handlers: grep for `onClick={handleClick}` patterns (correct) vs `onClick={() => handleClick()}` (forbidden); refactor any violations (FR-061)
- [ ] T203.9 [P] Audit all JSX for `dangerouslySetInnerHTML` usage: grep codebase for `dangerouslySetInnerHTML`; document and replace with sanitized alternatives using safe HTML libraries (FR-063)
- [ ] T203.10 [P] Audit all component props for explicit TypeScript typing: verify no props use `any` type; all component props interfaces explicitly defined; external props validated with Zod (FR-064)
- [ ] T203.11 [P] Audit all list rendering for proper `key` props: verify list items have stable, unique keys (not array indices); fragments have keys when applicable (FR-066)
- [ ] T203.12 [P] Audit all custom hooks for proper extraction: identify complex logic in components >50 lines; extract into custom hooks for reusability and testability (FR-059)
- [ ] T203.13 [P] Code review gate: All pull requests must include evidence of code style validation: ESLint report showing 0 functional programming violations, 0 unsafe JSX patterns (T017.5, T017.6)
- [ ] T203.14 [P] Create code style guide documentation in docs/CODE_STYLE.md: Document functional programming patterns with examples, provide before/after code examples for anti-patterns, link to ESLint configuration

### Security Hardening Tests (TDD) 🧪

> **TDD**: Write these security tests FIRST - Critical for production readiness

- [ ] T046.5 [P] Security test for CSP header validation in tests/security/csp-headers.test.ts: Verify response includes Content-Security-Policy header with expected directives; run OWASP ZAP scan to confirm inline scripts blocked
- [ ] T197 [P] Security test for webhook signature rejection in tests/security/webhook-security.test.ts
- [ ] T198 [P] Security test for rate limiting enforcement in tests/security/rate-limit.test.ts
- [ ] T199 [P] Security test verifying no card data in database in tests/security/pci-compliance.test.ts
- [ ] T200 [P] Security test verifying no secrets in error responses in tests/security/error-sanitization.test.ts
- [ ] T201 [P] Security test for HTTPS-only cookies in tests/security/cookie-security.test.ts
- [ ] T202 [P] Security test for SQL injection prevention in tests/security/sql-injection.test.ts

### Security Hardening Implementation

- [ ] T203 [P] Implement HTTPS redirect middleware (FR-042) in middleware.ts
- [ ] T204 [P] Add Content Security Policy headers in next.config.js (FR-048)
- [ ] T205 [P] Add HSTS headers in next.config.js
- [ ] T206 [P] Verify all API endpoints validate inputs with Zod schemas (FR-034)
- [ ] T207 [P] Verify no raw payment card data in logs or database (FR-038, FR-046)
- [ ] T208 Run npm audit and fix all critical/high vulnerabilities

### Design & Accessibility

- [ ] T209 [P] Define calming color palette in tailwind.config.js (blues, golds, greens per FR-030)
- [ ] T210 [P] Implement light/dark mode toggle with theme persistence in app/layout.tsx (FR-031)
- [ ] T211 [P] Verify all touch targets are minimum 44px tall (FR-032)

### Performance Optimization

- [ ] T215 [P] Add Redis caching for availability calculation results in lib/cache/availability.ts
- [ ] T216 [P] Optimize availability query with database indexes on startTime and status
- [ ] T217 [P] Implement pagination for booking list with limit/offset in admin API
- [ ] T218 Run Lighthouse performance audit and achieve 90+ score (SC-005)

### Documentation & Deployment

- [ ] T219 [P] Create SECURITY.md with vulnerability disclosure policy
- [ ] T220 [P] Create CONTRIBUTING.md with development guidelines
- [ ] T221 [P] Document all environment variables in README.md
- [ ] T222 [P] Create deployment guide for Vercel in docs/deployment.md
- [ ] T223 [P] Document PCI-DSS SAQ-A compliance checklist in .specify/compliance/pci-saq-a.md
- [ ] T224 Validate quickstart.md by following setup steps from scratch
- [ ] T225 Run end-to-end smoke tests on production deployment
- [ ] T226 Implement logging/monitoring to verify SC-003 (email delivery < 2 minutes).

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Phase 1 (Setup)**: No dependencies - start immediately
2. **Phase 2 (Foundational)**: Depends on Phase 1 complete - **BLOCKS all user stories**
3. **Phase 3 (US1)**: Depends on Phase 2 complete - MVP story
4. **Phase 4 (US2)**: Depends on Phase 2 complete - Can run parallel with US1 if staffed
5. **Phase 5 (US3)**: Depends on Phase 2 complete - Can run parallel with US1/US2 if staffed
6. **Phase 6 (US4)**: Depends on Phase 2 complete - Can run parallel with US1/US2/US3 if staffed
7. **Phase 7 (Polish)**: Depends on desired user stories complete

### User Story Independence

- **US1 (Customer Booking)**: Core MVP - No dependencies on other stories
- **US2 (Availability Management)**: Independent - Seed data allows US1 to function without US2
- **US3 (Booking Management)**: Independent - Reads bookings created by US1 but doesn't block US1
- **US4 (Service Configuration)**: Independent - Seed data allows US1 to function without US4

### Critical Path to MVP (US1 Only)

1. Phase 1: Setup (T001-T017) → ~2-3 hours
2. Phase 2: Foundational (T018-T047) → ~2-3 days
3. Phase 3: User Story 1 (T048-T074) → ~4-5 days
4. **Total MVP Time**: ~1 week with foundation

### Parallel Opportunities

**Within Phase 1 (Setup)**: All [P] tasks (T003-T017) can run parallel

**Within Phase 2 (Foundational)**:

- Database entities (T019-T025) can run parallel
- Services (T033-T037) can run parallel after schema complete
- Validation schemas (T038-T039) can run parallel
- Infrastructure configs (T042-T047) can run parallel

**Across User Stories** (after Phase 2 complete):

- Developer A: US1 (T048-T074) - Customer booking flow
- Developer B: US2 (T075-T092) - Availability management
- Developer C: US3 (T093-T111) - Booking management
- Developer D: US4 (T112-T123) - Service configuration

**Within Phase 7 (Polish)**: Most [P] tasks can run parallel

---

## Parallel Execution Examples

### User Story 1 - Customer Booking Flow

After foundational phase complete, these can run in parallel:

**Batch 1 - Models & Types:**

```
T048 [P] - Service model types
T058 [P] - Booking model types
```

**Batch 2 - API Endpoints:**

```
T049 [P] - GET /api/services
T050 [P] - GET /api/services/[serviceId]
T053 [P] - Availability calculation
T054 [P] - GET /api/availability/[serviceId]
T059 [P] - Stripe Elements integration
T060 [P] - Checkout form
T064 [P] - Webhook handler
```

**Batch 3 - Email & Calendar:**

```
T068 [P] - ICS generation
T069 [P] - Email template
T070 [P] - Email worker
T073 [P] - Audit logging
```

### User Story 2 - Availability Management

```
T075 [P] - BusinessHours types
T076 [P] - GET business-hours
T077 [P] - PUT business-hours
T080 [P] - DateOverride types
T081 [P] - GET date-overrides
T082 [P] - POST date-overrides
T086 [P] - SystemSettings types
T087 [P] - GET settings
```

---

## Implementation Strategy

### Option 1: MVP First (Fastest Path to Value)

**Week 1:**

1. Complete Phase 1: Setup (T001-T017) → 2-3 hours
2. Complete Phase 2: Foundational (T018-T047) → 2-3 days
3. Start Phase 3: User Story 1 (T048-T074) → Begin implementation

**Week 2:** 4. Complete Phase 3: User Story 1 → Finish MVP 5. **STOP & VALIDATE**: Test end-to-end booking flow 6. Deploy to staging/production 7. Collect feedback before building P2/P3 stories

**Result**: Functional booking system with payments in ~1-2 weeks

### Option 2: Incremental Delivery (Build All Stories Sequentially)

1. Phase 1 + 2: Foundation → ~3 days
2. Phase 3 (US1): Customer booking → Deploy/Demo → ~5 days
3. Phase 4 (US2): Availability management → Deploy/Demo → ~3 days
4. Phase 5 (US3): Booking management → Deploy/Demo → ~3 days
5. Phase 6 (US4): Service configuration → Deploy/Demo → ~2 days
6. Phase 7: Polish → Final production deployment → ~3 days

**Total**: ~3 weeks with validation checkpoints

### Option 3: Parallel Team (Fastest with Multiple Developers)

**Week 1:**

- Entire team: Phase 1 + 2 (Foundation) → ~3 days

**Week 2-3** (Parallel execution):

- Developer A: Phase 3 (US1) - Customer booking
- Developer B: Phase 4 (US2) - Availability management
- Developer C: Phase 5 (US3) - Booking management
- Developer D: Phase 6 (US4) - Service configuration

**Week 3:**

- Entire team: Phase 7 (Polish) + Integration testing → ~3 days

**Result**: All features delivered in ~2-3 weeks with 4 developers

---

## Task Summary

### Total Tasks: 225

**By Phase:**

- Phase 1 (Setup): 17 tasks
- Phase 2 (Foundational): 35 tasks (BLOCKING) - includes test infrastructure setup
- Phase 3 (US1 - Customer Booking): 61 tasks → **MVP** (27 tests + 34 implementation)
- Phase 4 (US2 - Availability Management): 27 tasks (9 tests + 18 implementation)
- Phase 5 (US3 - Booking Management): 27 tasks (8 tests + 19 implementation)
- Phase 6 (US4 - Service Configuration): 17 tasks (5 tests + 12 implementation)
- Phase 7 (Polish): 41 tasks (6 security tests + 35 implementation/polish)

**Parallel Opportunities:**

- Phase 1: 15 tasks marked [P]
- Phase 2: 27 tasks marked [P]
- Phase 3: 42 tasks marked [P] (includes parallelizable tests)
- Phase 4: 18 tasks marked [P]
- Phase 5: 15 tasks marked [P]
- Phase 6: 13 tasks marked [P]
- Phase 7: 37 tasks marked [P]

**Total Parallelizable Tasks**: 167 out of 225 (74%)

### MVP Scope (Phase 1 + 2 + 3)

**Tasks**: 113 tasks (50% of total)
**Features**: Full customer booking flow with payments
**Test Coverage**: 27 test tasks ensuring quality and preventing regressions
**Estimated Time**: 2-3 weeks (single developer with TDD) or ~1.5 weeks (team of 2-3)

**TDD Approach**: Tests written first for all critical paths (availability, booking, payment, webhooks, email)

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [P] tasks can run in parallel (different files, no dependencies on incomplete tasks)
- [Story] labels (US1-US4) map to user stories in spec.md for traceability
- Each user story is independently completable and testable
- **TDD REQUIRED**: Tests marked with 🧪 MUST be written FIRST and must FAIL before implementation
- **Keep it simple**: Write minimal test code needed to verify requirements - no over-engineering
- Phase 2 (Foundational) MUST complete before any user story work begins
- Commit after each test passes (not before) for incremental progress
- Stop at any checkpoint to validate story independently
- MVP = Phase 1 + 2 + 3 only (Customer booking flow with payments, including all tests)
