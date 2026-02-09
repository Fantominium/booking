# Tasks: TruFlow Booking Platform

**Feature**: [001-truflow-booking](spec.md)  
**Generated**: 2026-02-09  
**Status**: Ready for Implementation  

**Source Documents**:

- [IMPL_PLAN.md](IMPL_PLAN.md) - Technical stack and architecture decisions
- [spec.md](spec.md) - User stories with priorities (P1, P2, P3)
- [.specify/data-model.md](.specify/data-model.md) - 7 entities with relationships
- [.specify/contracts/openapi.yaml](.specify/contracts/openapi.yaml) - 28 API endpoints
- [.specify/research.md](.specify/research.md) - 11 technical decisions resolved
- [.specify/quickstart.md](.specify/quickstart.md) - Development environment setup

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: NOT INCLUDED - The specification does not explicitly request TDD approach or test generation. Tests can be added later if needed.

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

- [ ] T001 Create Next.js 14+ project with TypeScript, App Router, and Tailwind CSS
- [ ] T002 Install and configure pnpm as package manager with workspace setup
- [ ] T003 [P] Configure TypeScript strict mode and ESLint with security rules
- [ ] T004 [P] Setup Prettier for code formatting with Tailwind plugin
- [ ] T005 [P] Initialize Git repository with .gitignore for .env.local and node_modules
- [ ] T006 [P] Setup Storybook for component documentation and development
- [ ] T007 Install Prisma ORM and initialize with PostgreSQL provider
- [ ] T008 [P] Install core dependencies: Zod, React Query, date-fns, React Hook Form
- [ ] T009 [P] Install Stripe SDK (stripe) and Stripe.js (@stripe/stripe-js, @stripe/react-stripe-js)
- [ ] T010 [P] Install BullMQ and Redis client for job queue
- [ ] T011 [P] Install next-auth for authentication
- [ ] T012 [P] Install Resend SDK for transactional email
- [ ] T013 [P] Install ics package for calendar file generation
- [ ] T014 [P] Setup MUI Base components library
- [ ] T015 Create project directory structure: app/, components/, lib/, services/, types/
- [ ] T016 [P] Create .env.local.example with all required environment variables documented
- [ ] T017 [P] Setup GitHub Actions CI/CD workflow for linting and security scanning (npm audit, Snyk)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema & Migrations

- [ ] T018 Define Prisma schema for Service entity in prisma/schema.prisma
- [ ] T019 [P] Define Prisma schema for Booking entity with unique composite index (serviceId, startTime)
- [ ] T020 [P] Define Prisma schema for BusinessHours entity
- [ ] T021 [P] Define Prisma schema for DateOverride entity
- [ ] T022 [P] Define Prisma schema for SystemSettings entity (singleton)
- [ ] T023 [P] Define Prisma schema for PaymentAuditLog entity
- [ ] T024 [P] Define Prisma schema for DataDeletionAuditLog entity
- [ ] T025 [P] Define Prisma schema for Admin entity (for next-auth)
- [ ] T026 Run initial Prisma migration to create all tables with indexes
- [ ] T027 Create database seed script in prisma/seed.ts for initial services, business hours, and system settings

### Authentication & Authorization

- [ ] T028 Configure next-auth with CredentialsProvider for email/password in app/api/auth/[...nextauth]/route.ts
- [ ] T029 [P] Create Admin model and database integration for next-auth
- [ ] T030 [P] Implement bcrypt password hashing in lib/auth/password.ts
- [ ] T031 [P] Create authentication middleware for admin routes in middleware.ts
- [ ] T032 [P] Implement session management with HttpOnly, Secure, SameSite=Strict cookies

### Core Business Logic Services

- [ ] T033 Create AvailabilityService in lib/services/availability.ts with slot calculation logic
- [ ] T034 [P] Create BookingService in lib/services/booking.ts with atomic transaction and row-level locking
- [ ] T035 [P] Create PaymentService in lib/services/payment.ts for Stripe PaymentIntent integration
- [ ] T036 [P] Create EmailService in lib/services/email.ts with BullMQ job queue integration
- [ ] T037 [P] Create IcsService in lib/services/ics.ts for calendar file generation

### Validation & Error Handling

- [ ] T038 Define Zod schemas for all entities in lib/schemas/entities.ts
- [ ] T039 [P] Define Zod schemas for API request/response payloads in lib/schemas/api.ts
- [ ] T040 [P] Create error handling utilities in lib/errors.ts with sanitized error messages (FR-045)
- [ ] T041 [P] Create API response formatters in lib/api/responses.ts

### Infrastructure Configuration

- [ ] T042 Setup Redis connection and BullMQ queue initialization in lib/queue/config.ts
- [ ] T043 [P] Configure Stripe client with API keys in lib/stripe/config.ts
- [ ] T044 [P] Configure Resend email client in lib/email/config.ts
- [ ] T045 [P] Create environment variable validation utility in lib/config/env.ts
- [ ] T046 [P] Setup security headers (CSP, HSTS) in next.config.js (FR-048)
- [ ] T047 [P] Implement rate limiting middleware in lib/middleware/rate-limit.ts (FR-043)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Customer Books Massage Appointment (Priority: P1) 🎯 MVP

**Goal**: Enable customers to browse services, select date/time, provide contact details, pay down-payment via Stripe, and receive confirmation with calendar file.

**Why MVP**: This is the core revenue-generating flow. Without this working end-to-end, the business cannot accept bookings or collect payments.

**Independent Test**: Navigate through booking flow from service selection → date/time picker → checkout → Stripe payment → success page with calendar download. Verify booking appears in database with CONFIRMED status and confirmation email sent.

### Customer Service Catalog

- [ ] T048 [P] [US1] Create Service model types in types/service.ts
- [ ] T049 [P] [US1] Implement GET /api/services endpoint in app/api/services/route.ts
- [ ] T050 [P] [US1] Implement GET /api/services/[serviceId] endpoint in app/api/services/[serviceId]/route.ts
- [ ] T051 [US1] Create ServiceCard component in components/booking/ServiceCard.tsx with Storybook story
- [ ] T052 [US1] Create ServiceCatalog page in app/book/page.tsx displaying all active services

### Availability Calculation & Display

- [ ] T053 [P] [US1] Implement availability calculation logic in lib/services/availability.ts (business hours, date overrides, buffer time, daily cap)
- [ ] T054 [P] [US1] Implement GET /api/availability/[serviceId] endpoint in app/api/availability/[serviceId]/route.ts
- [ ] T055 [US1] Create DatePicker component in components/booking/DatePicker.tsx with unavailable dates grayed out
- [ ] T056 [US1] Create TimeSlotPicker component in components/booking/TimeSlotPicker.tsx showing available times
- [ ] T057 [US1] Create booking flow page in app/book/[serviceId]/page.tsx with date/time selection

### Guest Checkout & Payment

- [ ] T058 [P] [US1] Create Booking model types in types/booking.ts
- [ ] T059 [P] [US1] Implement Stripe Elements integration in components/payment/StripePaymentForm.tsx
- [ ] T060 [P] [US1] Create checkout form with guest details (name, email, phone) in components/booking/CheckoutForm.tsx
- [ ] T061 [US1] Implement POST /api/payment-intents endpoint in app/api/payment-intents/route.ts to create PaymentIntent
- [ ] T062 [US1] Implement POST /api/bookings endpoint in app/api/bookings/route.ts with atomic transaction and row-level locking (FR-004)
- [ ] T063 [US1] Implement automatic refund on booking conflict in lib/services/payment.ts (FR-007b)

### Payment Confirmation & Webhooks

- [ ] T064 [P] [US1] Implement Stripe webhook handler in app/api/webhooks/stripe/[token]/route.ts with signature verification (FR-041)
- [ ] T065 [P] [US1] Implement webhook event processing for payment_intent.succeeded in lib/services/booking.ts
- [ ] T066 [P] [US1] Implement idempotency handling for webhook retries in lib/services/payment.ts
- [ ] T067 [US1] Update booking status to CONFIRMED on successful payment in BookingService

### Email & Calendar Integration

- [ ] T068 [P] [US1] Create ICS calendar file generation in lib/services/ics.ts with booking details and 24-hour reminder
- [ ] T069 [P] [US1] Create booking confirmation email template in lib/email/templates/booking-confirmation.tsx
- [ ] T070 [P] [US1] Implement BullMQ email worker in workers/email-worker.ts with exponential backoff (1, 5, 15 min)
- [ ] T071 [US1] Queue confirmation email job on booking confirmation in lib/services/booking.ts
- [ ] T072 [US1] Create success page in app/book/success/page.tsx displaying booking details and ICS download

### Payment Audit Logging

- [ ] T073 [P] [US1] Implement payment audit logging in lib/services/audit.ts for all payment operations (FR-044)
- [ ] T074 [US1] Log INTENT_CREATED, PAYMENT_CONFIRMED, PAYMENT_FAILED, REFUND_ISSUED events in PaymentAuditLog

**Checkpoint**: User Story 1 complete - Full customer booking flow functional with payment processing and email notifications

---

## Phase 4: User Story 2 - Admin Manages Business Availability (Priority: P2)

**Goal**: Enable business owner to configure operating hours by day of week and block specific dates for holidays or closures.

**Why P2**: Without availability management, the system cannot accurately calculate open slots. This is foundational for the booking engine but can initially use seeded default values, making customer booking (P1) possible first.

**Independent Test**: Login to admin panel → Navigate to Availability Management → Update Monday hours from 9 AM-5 PM to 10 AM-6 PM → Save → Verify customer calendar reflects new hours. Add date override for Christmas → Verify date becomes unavailable.

### Business Hours Configuration

- [ ] T075 [P] [US2] Create BusinessHours model types in types/availability.ts
- [ ] T076 [P] [US2] Implement GET /api/admin/business-hours endpoint in app/api/admin/business-hours/route.ts
- [ ] T077 [P] [US2] Implement PUT /api/admin/business-hours endpoint to update operating hours
- [ ] T078 [US2] Create BusinessHoursForm component in components/admin/BusinessHoursForm.tsx for day-by-day configuration
- [ ] T079 [US2] Create Availability Management page in app/admin/availability/page.tsx

### Date Overrides Configuration

- [ ] T080 [P] [US2] Create DateOverride model types in types/availability.ts
- [ ] T081 [P] [US2] Implement GET /api/admin/date-overrides endpoint in app/api/admin/date-overrides/route.ts
- [ ] T082 [P] [US2] Implement POST /api/admin/date-overrides endpoint to create date override
- [ ] T083 [P] [US2] Implement DELETE /api/admin/date-overrides/[id] endpoint to remove override
- [ ] T084 [US2] Create DateOverrideForm component in components/admin/DateOverrideForm.tsx with reason field
- [ ] T085 [US2] Add date override management section to Availability Management page

### System Settings Configuration

- [ ] T086 [P] [US2] Create SystemSettings model types in types/settings.ts
- [ ] T087 [P] [US2] Implement GET /api/admin/settings endpoint in app/api/admin/settings/route.ts
- [ ] T088 [P] [US2] Implement PATCH /api/admin/settings endpoint to update max bookings per day and buffer time
- [ ] T089 [US2] Create SystemSettingsForm component in components/admin/SystemSettingsForm.tsx
- [ ] T090 [US2] Add system settings section to Availability Management page

### Immediate Availability Refresh

- [ ] T091 [US2] Implement cache invalidation for availability changes in lib/cache/availability.ts (FR-015)
- [ ] T092 [US2] Verify customer-facing calendar reflects changes immediately without restart

**Checkpoint**: User Story 2 complete - Admin can fully control business availability and settings

---

## Phase 5: User Story 3 - Admin Manages Bookings and Payments (Priority: P3)

**Goal**: Enable business owner to view bookings in filterable list, mark remaining balances as paid when customers pay in-person, and cancel bookings when necessary.

**Why P3**: This enables day-to-day operations management but isn't required for the initial booking flow to work. Can be implemented after core booking and availability management are stable.

**Independent Test**: Login to admin panel → Navigate to Booking Management → Filter by "Confirmed" status → Select booking with unpaid balance → Click "Mark Balance as Paid" → Verify status updates to COMPLETED. Cancel a booking → Verify time slot becomes available again and customer receives cancellation email.

### Admin Booking List & Dashboard

- [ ] T093 [P] [US3] Implement GET /api/admin/bookings endpoint with filtering (status, date range) in app/api/admin/bookings/route.ts
- [ ] T094 [P] [US3] Implement GET /api/admin/bookings/[id] endpoint for booking details in app/api/admin/bookings/[id]/route.ts
- [ ] T095 [P] [US3] Implement GET /api/admin/dashboard/today endpoint for today's schedule in app/api/admin/dashboard/today/route.ts
- [ ] T096 [P] [US3] Implement GET /api/admin/dashboard/pending-actions endpoint for unpaid balances and email failures in app/api/admin/dashboard/pending-actions/route.ts
- [ ] T097 [US3] Create BookingList component in components/admin/BookingList.tsx with MUI DataGrid for filtering and sorting
- [ ] T098 [US3] Create Dashboard page in app/admin/page.tsx with today's schedule and pending actions
- [ ] T099 [US3] Create Booking Management page in app/admin/bookings/page.tsx with filterable list

### Payment Status Management

- [ ] T100 [P] [US3] Implement POST /api/admin/bookings/[id]/mark-paid endpoint in app/api/admin/bookings/[id]/mark-paid/route.ts
- [ ] T101 [US3] Update booking status to COMPLETED and log payment completion in lib/services/booking.ts
- [ ] T102 [US3] Create MarkPaidButton component in components/admin/MarkPaidButton.tsx with confirmation dialog
- [ ] T103 [US3] Add payment status display to booking detail view

### Booking Cancellation

- [ ] T104 [P] [US3] Implement POST /api/admin/bookings/[id]/cancel endpoint in app/api/admin/bookings/[id]/cancel/route.ts
- [ ] T105 [US3] Update booking status to CANCELLED and free time slot in lib/services/booking.ts
- [ ] T106 [US3] Create cancellation email template in lib/email/templates/booking-cancellation.tsx
- [ ] T107 [US3] Queue cancellation email job on booking cancellation
- [ ] T108 [US3] Create CancelBookingButton component in components/admin/CancelBookingButton.tsx with confirmation dialog

### Search & Filtering

- [ ] T109 [P] [US3] Implement debounced search by customer name/phone in BookingList component (FR-018a)
- [ ] T110 [US3] Add status filter dropdown to BookingList component (Pending, Confirmed, Completed, Cancelled)
- [ ] T111 [US3] Add date range filter to BookingList component

**Checkpoint**: User Story 3 complete - Admin can fully manage bookings, payments, and cancellations

---

## Phase 6: User Story 4 - Admin Configures Services (Priority: P3)

**Goal**: Enable business owner to add new massage services, update pricing or down-payment amounts, edit service descriptions, and remove discontinued services.

**Why P3**: Service configuration is essential but can start with seed data. The admin doesn't need to modify services immediately for customers to book. This can follow operational management features.

**Independent Test**: Login to admin panel → Navigate to Service Configuration → Click "Add Service" → Enter "Hot Stone Massage", 75 minutes, $120, $30 down-payment → Save → Verify service appears on customer catalog. Edit "Swedish Massage" price from $80 to $90 → Verify customer sees new price. Delete "Aromatherapy Session" → Verify removed from catalog but existing bookings intact.

### Service Management API

- [ ] T112 [P] [US4] Implement POST /api/admin/services endpoint to create service in app/api/admin/services/route.ts
- [ ] T113 [P] [US4] Implement PATCH /api/admin/services/[id] endpoint to update service in app/api/admin/services/[id]/route.ts
- [ ] T114 [P] [US4] Implement DELETE /api/admin/services/[id] endpoint with validation for future bookings (FR-025) in app/api/admin/services/[id]/route.ts
- [ ] T115 [US4] Validate downpaymentCents <= priceCents and durationMin > 0 in service validation

### Service Configuration UI

- [ ] T116 [P] [US4] Create ServiceForm component in components/admin/ServiceForm.tsx with Zod validation
- [ ] T117 [P] [US4] Create ServiceList component in components/admin/ServiceList.tsx with edit/delete actions
- [ ] T118 [US4] Create Service Configuration page in app/admin/services/page.tsx
- [ ] T119 [US4] Add "Add Service" button and modal dialog to Service Configuration page
- [ ] T120 [US4] Implement inline editing for service details in ServiceList component

### Service Deletion Validation

- [ ] T121 [US4] Implement validation to prevent deletion of services with existing future bookings (FR-025)
- [ ] T122 [US4] Display error message when attempting to delete service with future bookings
- [ ] T123 [US4] Add "Mark Inactive" option as alternative to deletion for services with bookings

**Checkpoint**: User Story 4 complete - Admin can fully manage service catalog

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final production readiness

### Admin Authentication & User Management

- [ ] T124 [P] Create admin login page in app/admin/login/page.tsx
- [ ] T125 [P] Implement password reset flow with email token in app/api/auth/password-reset/route.ts
- [ ] T126 [P] Create password reset email template in lib/email/templates/password-reset.tsx
- [ ] T127 [P] Implement GET /api/admin/admins endpoint to list admins in app/api/admin/admins/route.ts
- [ ] T128 [P] Implement POST /api/admin/admins endpoint to add admin user in app/api/admin/admins/route.ts
- [ ] T129 [P] Implement DELETE /api/admin/admins/[id] endpoint to remove admin in app/api/admin/admins/[id]/route.ts
- [ ] T130 Create Manage Admins page in app/admin/admins/page.tsx

### Customer Data Privacy & Deletion

- [ ] T131 [P] Implement POST /api/customer-data/request-deletion endpoint in app/api/customer-data/request-deletion/route.ts
- [ ] T132 [P] Implement POST /api/customer-data/confirm-deletion endpoint with token verification in app/api/customer-data/confirm-deletion/route.ts
- [ ] T133 [P] Create deletion request email template with verification token in lib/email/templates/deletion-request.tsx
- [ ] T134 [P] Implement PII anonymization logic in lib/services/data-deletion.ts (FR-052)
- [ ] T135 [P] Log all deletions in DataDeletionAuditLog with email hash and reason
- [ ] T136 Create scheduled job for automatic PII purge (2-year threshold) in jobs/pii-purge.ts (FR-051)

### Email Delivery Monitoring

- [ ] T137 [P] Add email delivery status tracking to Booking entity (SUCCESS, FAILED, RETRYING)
- [ ] T138 [P] Display email delivery status in admin booking detail view
- [ ] T139 [P] Implement manual email resend action in admin panel
- [ ] T140 Create refund notification email template in lib/email/templates/refund-notification.tsx

### Security Hardening

- [ ] T141 [P] Implement HTTPS redirect middleware (FR-042) in middleware.ts
- [ ] T142 [P] Add Content Security Policy headers in next.config.js (FR-048)
- [ ] T143 [P] Add HSTS headers in next.config.js
- [ ] T144 [P] Verify all API endpoints validate inputs with Zod schemas (FR-034)
- [ ] T145 [P] Verify no raw payment card data in logs or database (FR-038, FR-046)
- [ ] T146 Run npm audit and fix all critical/high vulnerabilities

### Design & Accessibility

- [ ] T147 [P] Define calming color palette in tailwind.config.js (blues, golds, greens per FR-030)
- [ ] T148 [P] Implement light/dark mode toggle with theme persistence in app/layout.tsx (FR-031)
- [ ] T149 [P] Verify all touch targets are minimum 44px tall (FR-032)
- [ ] T150 [P] Verify WCAG 2.2 Level AA contrast ratios for all text (SC-011)
- [ ] T151 [P] Add semantic HTML and ARIA labels for screen reader accessibility (FR-033)
- [ ] T152 Run Lighthouse accessibility audit and achieve 100 score (SC-005)

### Performance Optimization

- [ ] T153 [P] Add Redis caching for availability calculation results in lib/cache/availability.ts
- [ ] T154 [P] Optimize availability query with database indexes on startTime and status
- [ ] T155 [P] Implement pagination for booking list with limit/offset in admin API
- [ ] T156 Run Lighthouse performance audit and achieve 90+ score (SC-005)

### Documentation & Deployment

- [ ] T157 [P] Create SECURITY.md with vulnerability disclosure policy
- [ ] T158 [P] Create CONTRIBUTING.md with development guidelines
- [ ] T159 [P] Document all environment variables in README.md
- [ ] T160 [P] Create deployment guide for Vercel in docs/deployment.md
- [ ] T161 [P] Document PCI-DSS SAQ-A compliance checklist in .specify/compliance/pci-saq-a.md
- [ ] T162 Validate quickstart.md by following setup steps from scratch
- [ ] T163 Run end-to-end smoke tests on production deployment

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

**Week 2:**
4. Complete Phase 3: User Story 1 → Finish MVP
5. **STOP & VALIDATE**: Test end-to-end booking flow
6. Deploy to staging/production
7. Collect feedback before building P2/P3 stories

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

### Total Tasks: 163

**By Phase:**

- Phase 1 (Setup): 17 tasks
- Phase 2 (Foundational): 30 tasks (BLOCKING)
- Phase 3 (US1 - Customer Booking): 27 tasks → **MVP**
- Phase 4 (US2 - Availability Management): 18 tasks
- Phase 5 (US3 - Booking Management): 19 tasks
- Phase 6 (US4 - Service Configuration): 12 tasks
- Phase 7 (Polish): 40 tasks

**Parallel Opportunities:**

- Phase 1: 15 tasks marked [P]
- Phase 2: 22 tasks marked [P]
- Phase 3: 16 tasks marked [P]
- Phase 4: 11 tasks marked [P]
- Phase 5: 9 tasks marked [P]
- Phase 6: 8 tasks marked [P]
- Phase 7: 31 tasks marked [P]

**Total Parallelizable Tasks**: 112 out of 163 (69%)

### MVP Scope (Phase 1 + 2 + 3)

**Tasks**: 74 tasks (45% of total)
**Features**: Full customer booking flow with payments
**Estimated Time**: 1-2 weeks (single developer) or ~1 week (team of 2-3)

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [P] tasks can run in parallel (different files, no dependencies on incomplete tasks)
- [Story] labels (US1-US4) map to user stories in spec.md for traceability
- Each user story is independently completable and testable
- Tests NOT included per specification (can be added later if requested)
- Phase 2 (Foundational) MUST complete before any user story work begins
- Commit after each task or logical group for incremental progress
- Stop at any checkpoint to validate story independently
- MVP = Phase 1 + 2 + 3 only (Customer booking flow with payments)
