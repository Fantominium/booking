# Tasks: TruFlow Journey Hardening Remediation

**Input**: Design documents from `/specs/003-journey-hardening-remediation/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: BDD, contract, integration, security, E2E, Storybook, and regression coverage are required for this remediation because the feature explicitly changes booking outcomes, admin authorization, and accessibility-critical navigation.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently, while shared discovery, schema, and security foundations land first.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel after dependencies in the current phase are satisfied
- **[Story]**: User story label from `spec.md` (`US1` to `US5`)
- Every task names the concrete file path(s) that should be changed

## Phase 1: Setup And Discovery

**Purpose**: Audit the current application so implementation work follows verified gaps instead of assumptions.

- [ ] T001 Update `specs/003-journey-hardening-remediation/research.md` with a customer journey reachability audit matrix covering homepage CTAs, catalog entry points, direct booking routes, and dead-end transitions for session, event, and rental flows
- [ ] T002 Update `specs/003-journey-hardening-remediation/research.md` with an admin dashboard reachability audit covering `/admin`, `/admin/services`, `/admin/bookings`, `/admin/availability`, `/admin/admins`, and the matching `/api/admin/*` endpoints
- [ ] T003 Update `specs/003-journey-hardening-remediation/research.md` with navigation modal, close-icon transition, theme contrast, typography, and header branding audit findings for mobile and desktop surfaces
- [ ] T004 Update `specs/003-journey-hardening-remediation/quickstart.md` with reproducible discovery steps, audit checkpoints, and focused regression commands for the remediation work

---

## Phase 2: Foundational Security And Data Model

**Purpose**: Land the schema, contract, and authorization foundations that block later booking, admin, and UI changes.

**⚠️ CRITICAL**: Complete this phase before user-story implementation begins.

- [ ] T005 [P] Add failing contract coverage for booking payment-choice payloads and bank-transfer outcomes in `tests/contract/bookings.test.ts`
- [ ] T006 [P] Add failing integration and security coverage for admin denial-before-render and stale-session behavior in `tests/integration/auth/admin-gate.test.ts` and `tests/security/cookie-security.test.ts`
- [ ] T007 [P] Extend service, booking, and system settings schema for offering taxonomy, payment choice or state, and bank-transfer configuration in `prisma/schema.prisma`
- [ ] T008 Create the Prisma migration for journey-hardening schema changes in `prisma/migrations/20260320_journey_hardening_remediation/migration.sql`
- [ ] T009 [P] Seed session, event, and rental offerings plus bank-transfer configuration in `prisma/seed.ts`
- [ ] T010 [P] Extend request and entity schemas for payment choice, booking outcome semantics, and offering mapping in `src/lib/schemas/api.ts` and `src/lib/schemas/entities.ts`
- [ ] T011 Create shared admin authorization helpers for route handlers and server-rendered admin pages in `src/lib/auth/admin.ts`
- [ ] T012 Update `proxy.ts` to enforce consistent admin-only redirects and API denial responses before protected content renders
- [ ] T013 Apply the shared admin guard in `src/app/api/admin/dashboard/today/route.ts`, `src/app/api/admin/dashboard/pending-actions/route.ts`, `src/app/api/admin/services/route.ts`, and `src/app/api/admin/admins/route.ts`
- [ ] T014 Update `specs/003-journey-hardening-remediation/contracts/openapi.yaml` to reflect booking payment-choice payloads, pending-transfer booking states, and hardened admin authorization responses

**Checkpoint**: Schema, contract, and admin guardrails are in place; customer, payment, and admin story work can proceed safely.

---

## Phase 3: User Story 1 - Customer Completes Any Booking Journey (Priority: P1) 🎯 MVP

**Goal**: Make session, event, and rental booking journeys reachable end to end from supported public entry points.

**Independent Test**: Starting from the homepage or booking catalog, a tester can complete a session, event, and rental booking flow without dead ends and reach a clear success or recovery state.

### Tests For User Story 1

- [ ] T015 [P] [US1] Add BDD reachability scenarios for session, event, and rental completion in `specs/003-journey-hardening-remediation/bdd/customer-journey-completion.feature`
- [ ] T016 [P] [US1] Extend integration coverage for offering mapping, unavailable-slot recovery, and preserved form state in `tests/integration/booking.test.ts` and `tests/integration/booking-conflict.test.ts`
- [ ] T017 [US1] Extend public reachability and booking completion coverage in `tests/e2e/booking-flow.spec.ts` and `tests/e2e/navigation/customer-flow.spec.ts`

### Implementation For User Story 1

- [ ] T018 [P] [US1] Update public catalog entry points and card metadata for session, event, and rental discovery in `src/app/book/page.tsx` and `src/components/booking/ServiceCard.tsx`
- [ ] T019 [US1] Refactor the booking journey step orchestration to preserve customer progress through selection, details, and recovery paths in `src/components/booking/BookingFlow.tsx`
- [ ] T020 [US1] Update service-booking and success routes to surface complete journey outcomes and recovery messaging in `src/app/book/[serviceId]/page.tsx` and `src/app/book/success/page.tsx`
- [ ] T021 [US1] Wire offering taxonomy and journey outcome labels through shared booking types and services in `src/types/booking.ts` and `src/lib/services/booking.ts`

**Checkpoint**: Session, event, and rental flows are reachable and independently testable without changing payment semantics yet.

---

## Phase 4: User Story 2 - Customer Chooses How To Pay (Priority: P1)

**Goal**: Present explicit payment choices at the end of the booking flow and distinguish fully paid bookings from reserved bank-transfer bookings.

**Independent Test**: A tester can complete the same booking journey with immediate payment and with bank transfer, and each path reports the correct next steps and booking state.

### Tests For User Story 2

- [ ] T022 [P] [US2] Add BDD scenarios for immediate-payment and bank-transfer outcomes in `specs/003-journey-hardening-remediation/bdd/payment-choice.feature`
- [ ] T023 [P] [US2] Extend contract and integration coverage for payment-choice payloads and pending-transfer booking state in `tests/contract/bookings.test.ts` and `tests/integration/booking.test.ts`
- [ ] T024 [US2] Extend checkout end-to-end coverage for card and bank-transfer branches in `tests/e2e/booking-flow.spec.ts`

### Implementation For User Story 2

- [ ] T025 [US2] Update the booking creation endpoint to accept a payment choice and return payment-specific outcome payloads in `src/app/api/bookings/route.ts`
- [ ] T026 [US2] Extend booking and payment services for bank-transfer reservation handling and immediate-payment status transitions in `src/lib/services/booking.ts` and `src/lib/services/payment.ts`
- [ ] T027 [US2] Add payment-option UI, bank-transfer instructions, and outcome messaging in `src/components/booking/CheckoutForm.tsx` and `src/components/payment/StripePaymentForm.tsx`
- [ ] T028 [US2] Surface pending-transfer and paid states in admin booking and settings surfaces in `src/app/admin/bookings/page.tsx`, `src/components/admin/BookingList.tsx`, `src/app/api/admin/settings/route.ts`, and `src/components/admin/SystemSettingsForm.tsx`

**Checkpoint**: The booking flow now ends with explicit payment choice and clear booking outcome states.

---

## Phase 5: User Story 4 - Non-Admins Are Excluded From Admin Surfaces (Priority: P1)

**Goal**: Hide admin-only surfaces from non-admins and deny direct admin access before protected content renders.

**Independent Test**: An unauthenticated or non-admin user cannot see admin actions in public navigation and cannot access admin URLs or admin APIs through direct loads, refreshes, or expired sessions.

### Tests For User Story 4

- [ ] T029 [P] [US4] Add BDD scenarios for hidden admin surfaces, direct URL denial, and expired-session recovery in `specs/003-journey-hardening-remediation/bdd/admin-authorization.feature`
- [ ] T030 [P] [US4] Extend integration and security regression coverage for direct URL denial and session downgrade handling in `tests/integration/admin-auth.test.ts`, `tests/integration/auth/admin-gate.test.ts`, and `tests/security/cookie-security.test.ts`
- [ ] T031 [US4] Extend end-to-end coverage for hidden admin affordances and unauthorized route rejection in `tests/e2e/navigation/admin-flow.spec.ts` and `tests/e2e/navigation/customer-flow.spec.ts`

### Implementation For User Story 4

- [ ] T032 [US4] Hide admin navigation and action affordances from non-admin sessions in `src/components/Header.tsx` and `src/components/navigation/AdminDropdown.tsx`
- [ ] T033 [US4] Enforce shared admin authorization on server-rendered admin pages in `src/app/admin/page.tsx`, `src/app/admin/bookings/page.tsx`, `src/app/admin/services/page.tsx`, `src/app/admin/availability/page.tsx`, and `src/app/admin/admins/page.tsx`
- [ ] T034 [US4] Align admin login and NextAuth session handling with admin-only redirects and expiry recovery in `src/app/admin/login/page.tsx` and `src/app/api/auth/[...nextauth]/route.ts`

**Checkpoint**: Non-admins can neither discover nor load protected admin surfaces, even through direct URL or stale browser state.

---

## Phase 6: User Story 3 - Admin Reaches And Operates The Secure Dashboard (Priority: P1)

**Goal**: Ensure authenticated admins can reach the dashboard and complete the core operational flows for offerings, availability, bookings, and admin management.

**Independent Test**: An authenticated admin can load the dashboard, manage services, update business hours and date overrides, review bookings, and reach admin-management surfaces without broken transitions.

### Tests For User Story 3

- [ ] T035 [P] [US3] Add BDD scenarios for dashboard reachability and core admin workflows in `specs/003-journey-hardening-remediation/bdd/admin-dashboard-operations.feature`
- [ ] T036 [P] [US3] Extend contract and integration coverage for dashboard data, service management, and availability flows in `tests/contract/admin-dashboard.test.ts`, `tests/contract/admin-services.test.ts`, `tests/contract/admin-availability.test.ts`, and `tests/integration/admin-management.test.ts`
- [ ] T037 [US3] Extend admin end-to-end coverage for dashboard, services, availability, bookings, and admin-management routes in `tests/e2e/navigation/admin-flow.spec.ts`

### Implementation For User Story 3

- [ ] T038 [US3] Fix admin dashboard reachability, data loading, and pending-action summaries in `src/app/admin/page.tsx`, `src/components/admin/AdminDashboardClient.tsx`, and `src/app/api/admin/dashboard/pending-actions/route.ts`
- [ ] T039 [US3] Complete service and availability management flows in `src/app/admin/services/page.tsx`, `src/components/admin/ServiceForm.tsx`, `src/app/admin/availability/page.tsx`, `src/components/admin/BusinessHoursForm.tsx`, and `src/components/admin/DateOverrideForm.tsx`
- [ ] T040 [US3] Complete booking and admin-management operational flows in `src/app/admin/bookings/page.tsx`, `src/app/api/admin/bookings/route.ts`, `src/app/admin/admins/page.tsx`, and `src/app/api/admin/admins/[id]/route.ts`

**Checkpoint**: Authenticated admins can complete key operational workflows on secure routes without broken screens or missing follow-up data.

---

## Phase 7: User Story 5 - Navigation, Accessibility, And Branding Are Corrected (Priority: P2)

**Goal**: Convert the mobile menu to a true accessible modal, fix close-control behavior, remediate readability issues, and replace the legacy header mark with the approved TruFlow logo.

**Independent Test**: On mobile and desktop, a tester can open the hamburger menu as a modal, close it with an accessible X or Escape, observe clean open and close transitions, confirm readable theme contrast and typography, and see the TruFlow logo to the left of the title.

### Tests For User Story 5

- [ ] T041 [P] [US5] Add BDD scenarios for modal navigation, close control, contrast, typography, and branded header behavior in `specs/003-journey-hardening-remediation/bdd/navigation-accessibility-branding.feature`
- [ ] T042 [P] [US5] Extend integration regression coverage for modal behavior, keyboard dismissal, and header visibility in `src/components/Header.test.tsx` and `tests/integration/components/Header.mobile.test.tsx`
- [ ] T043 [US5] Extend end-to-end regression coverage for hamburger modal behavior, close-icon transitions, and branded header rendering in `tests/e2e/navigation/hamburger-animation.spec.ts` and `tests/e2e/navigation/customer-flow.spec.ts`

### Implementation For User Story 5

- [ ] T044 [US5] Convert the hamburger menu into an accessible modal with focus trap, Escape handling, dismiss behavior, and focus return in `src/components/Header.tsx` and `src/components/navigation/HamburgerIcon.tsx`
- [ ] T045 [US5] Remediate close-icon transition states so the control is never visually ambiguous in `src/components/Header.tsx` and `src/components/navigation/HamburgerIcon.tsx`
- [ ] T046 [US5] Apply accessible theme, contrast, typography, and status-state fixes across shared surfaces in `src/app/globals.css`, `src/components/Header.tsx`, `src/components/admin/AdminLayout.tsx`, and `src/components/booking/CheckoutForm.tsx`
- [ ] T047 [US5] Replace the primary header hexagonal mark with the provided TruFlow logo and resilient fallback title treatment in `src/components/Header.tsx` and `public/logo.svg`

**Checkpoint**: Navigation, branding, and readability issues are remediated with executable accessibility regression coverage.

---

## Phase 8: Polish And Cross-Cutting Release Evidence

**Purpose**: Finish shared documentation, UI documentation, and regression evidence for release readiness.

- [ ] T048 [P] Update Storybook coverage for remediated header, modal, payment-choice, and admin booking states in `src/stories/navigation/Header.stories.tsx`, `src/stories/navigation/Header.mobile.stories.tsx`, `src/stories/navigation/Header.admin.stories.tsx`, and `src/components/booking/CheckoutForm.stories.tsx`
- [ ] T049 [P] Extend cross-story regression coverage for booking, admin, and navigation baselines in `tests/e2e/navigation/customer-flow.spec.ts`, `tests/e2e/navigation/admin-flow.spec.ts`, and `tests/integration/components/Header.test.tsx`
- [ ] T050 [P] Update remediation documentation for journey reachability, bank-transfer handling, and admin-only rules in `README.md`, `docs/ACCESSIBILITY_PERFORMANCE.md`, and `specs/003-journey-hardening-remediation/quickstart.md`
- [ ] T051 [P] Capture the final audit matrix, accessibility findings, and release evidence in `specs/003-journey-hardening-remediation/research.md` and `specs/003-journey-hardening-remediation/quickstart.md`
- [ ] T052 Validate the final remediation command set and record the passing suite scope in `specs/003-journey-hardening-remediation/quickstart.md`

---

## Dependencies And Execution Order

### Phase Dependencies

- **Phase 1 - Setup And Discovery**: Starts immediately and informs all later work
- **Phase 2 - Foundational Security And Data Model**: Depends on Phase 1 and blocks all user-story implementation
- **Phase 3 - US1 Customer Journey Completion**: Depends on Phase 2 and is the MVP delivery slice
- **Phase 4 - US2 Payment Choice**: Depends on Phase 3 because payment choice lands on the completed booking flow
- **Phase 5 - US4 Admin Exclusion**: Depends on Phase 2 and should land before secure admin workflow fixes are released
- **Phase 6 - US3 Admin Dashboard Reachability**: Depends on Phase 5 so operational fixes are built on hardened admin access rules
- **Phase 7 - US5 Navigation, Accessibility, And Branding**: Depends on Phase 2 and should merge after the core booking and admin behavior is stable enough for regression checks
- **Phase 8 - Polish And Cross-Cutting Release Evidence**: Depends on the completion of all desired user stories

### User Story Dependency Graph

- **US1**: Starts after Foundational with no dependency on other user stories
- **US2**: Depends on US1
- **US4**: Starts after Foundational and can run in parallel with US1 once shared auth work is complete
- **US3**: Depends on US4
- **US5**: Starts after Foundational, but is safest after US1 and US4 because it touches shared public and admin navigation surfaces

### Within Each User Story

- Write BDD, contract, integration, security, and E2E tests first where listed
- Land server-side or schema work before dependent UI changes
- Keep each story independently releasable after its checkpoint

---

## Parallel Execution Examples

### User Story 1

```bash
# Parallel test setup
T015 specs/003-journey-hardening-remediation/bdd/customer-journey-completion.feature
T016 tests/integration/booking.test.ts + tests/integration/booking-conflict.test.ts

# Parallel implementation after tests exist
T018 src/app/book/page.tsx + src/components/booking/ServiceCard.tsx
T021 src/types/booking.ts + src/lib/services/booking.ts
```

### User Story 2

```bash
# Parallel test setup
T022 specs/003-journey-hardening-remediation/bdd/payment-choice.feature
T023 tests/contract/bookings.test.ts + tests/integration/booking.test.ts

# Parallel implementation after endpoint shape is agreed
T026 src/lib/services/booking.ts + src/lib/services/payment.ts
T027 src/components/booking/CheckoutForm.tsx + src/components/payment/StripePaymentForm.tsx
```

### User Story 4

```bash
# Parallel test setup
T029 specs/003-journey-hardening-remediation/bdd/admin-authorization.feature
T030 tests/integration/admin-auth.test.ts + tests/integration/auth/admin-gate.test.ts + tests/security/cookie-security.test.ts

# Parallel implementation after shared guard exists
T032 src/components/Header.tsx + src/components/navigation/AdminDropdown.tsx
T034 src/app/admin/login/page.tsx + src/app/api/auth/[...nextauth]/route.ts
```

### User Story 3

```bash
# Parallel test setup
T035 specs/003-journey-hardening-remediation/bdd/admin-dashboard-operations.feature
T036 tests/contract/admin-dashboard.test.ts + tests/contract/admin-services.test.ts + tests/contract/admin-availability.test.ts + tests/integration/admin-management.test.ts

# Parallel implementation after auth hardening is merged
T038 src/app/admin/page.tsx + src/components/admin/AdminDashboardClient.tsx + src/app/api/admin/dashboard/pending-actions/route.ts
T039 src/app/admin/services/page.tsx + src/components/admin/ServiceForm.tsx + src/app/admin/availability/page.tsx + src/components/admin/BusinessHoursForm.tsx + src/components/admin/DateOverrideForm.tsx
```

### User Story 5

```bash
# Parallel test setup
T041 specs/003-journey-hardening-remediation/bdd/navigation-accessibility-branding.feature
T042 src/components/Header.test.tsx + tests/integration/components/Header.mobile.test.tsx

# Parallel implementation after modal approach is chosen
T046 src/app/globals.css + src/components/admin/AdminLayout.tsx + src/components/booking/CheckoutForm.tsx
T047 src/components/Header.tsx + public/logo.svg
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 discovery tasks so the team is working from a verified gap list
2. Complete Phase 2 foundational schema, contract, and admin-guard tasks
3. Deliver Phase 3 for US1 and validate public journey reachability end to end
4. Stop and verify the MVP before expanding into payment choice, admin hardening, and accessibility remediation

### Incremental Delivery

1. Foundation: discovery, schema, API contract, and shared admin authorization
2. Customer completion: reachability for session, event, and rental flows
3. Checkout clarity: payment choice and bank-transfer outcome handling
4. Security hardening: hide and deny admin surfaces for non-admins
5. Admin operability: dashboard and operational workflow completion on secured routes
6. UX remediation: modal navigation, accessibility, and TruFlow branding corrections
7. Release evidence: Storybook, regression coverage, docs, and audit artifacts

### Suggested MVP Scope

- **MVP**: Phase 3 only after Phases 1 and 2 are complete
- **Next highest value**: Phase 4 for payment-choice clarity
- **Operational hardening**: Phase 5 then Phase 6
- **Final UX correction layer**: Phase 7 followed by Phase 8

---

## Notes

- Tasks marked **[P]** are parallelizable because they touch separate files after the phase dependencies are satisfied
- The task order intentionally moves admin exclusion ahead of admin workflow fixes so security hardening precedes broader admin UI work
- BDD artifacts are feature-local under `specs/003-journey-hardening-remediation/bdd/` to match the planning documents and keep acceptance coverage close to the spec
- Each user story includes explicit test tasks plus implementation tasks so the remediation can be delivered and validated incrementally
