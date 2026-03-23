# Implementation Plan: TruFlow Journey Hardening Remediation

**Branch**: `003-journey-hardening-remediation` | **Date**: 2026-03-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-journey-hardening-remediation/spec.md`

## Summary

This feature is a remediation track for the existing Next.js booking application, not a rewrite. The plan focuses on closing verified gaps across customer journey reachability, payment-choice presentation, admin authorization hardening, admin dashboard reachability, navigation modal accessibility, header branding, and contrast or typography compliance while preserving the foundations already established by 001-truflow-booking, 001-unified-navigation, and 002-platform-overhaul.

The implementation strategy is audit-first and minimal-change:

- inventory public and admin entry points before changing behavior
- extend the current `Service`, `Booking`, admin route, and header surfaces where they already exist
- introduce only the smallest schema or API changes needed to distinguish payment choice and booking outcome states
- strengthen existing tests and add missing BDD, E2E, integration, and regression coverage around the remediated flows

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.2, Next.js 16 App Router  
**Primary Dependencies**: Prisma 5, PostgreSQL, NextAuth 4, Stripe, TanStack Query, Tailwind CSS 4, Storybook 10, Vitest 4, Playwright 1.58, Lucide React, MUI Base/X Data Grid  
**Storage**: PostgreSQL via Prisma; static assets in `public/`; feature artifacts under `specs/003-journey-hardening-remediation/`  
**Testing**: Vitest unit/integration/contract/security suites, Playwright E2E, Storybook visual states, feature-level BDD acceptance artifacts  
**Target Platform**: Responsive web application for customer and admin journeys on desktop and mobile  
**Project Type**: Single Next.js web application with App Router, route handlers, and background worker  
**Performance Goals**: No additional dead-end navigation steps; admin authorization denied before protected render; navigation modal open/close remains visually stable and keyboard operable; no material regression to existing booking latency or hydration behavior  
**Constraints**: Minimal focused changes over rewrite; preserve existing Stripe payment path while adding explicit bank transfer presentation; keep customer and admin surfaces WCAG 2.2 AA compliant; reuse existing route structure and proxy-based admin protection where practical  
**Scale/Scope**: Existing public booking flow in `src/app/book`, admin surface in `src/app/admin`, 28 route handlers under `src/app/api`, Prisma-backed booking domain, Storybook-backed header/navigation documentation, and broad existing test suites under `tests/`

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Pre-design gate review:

- [x] Storybook stories planned for all applicable UI components, especially header, navigation modal states, payment-choice presentation, and any updated admin/customer status UI.
- [x] OpenAPI coverage planned for every impacted API endpoint through a feature-local contract artifact, with implementation work to merge the affected paths into the repository's canonical API contract before release.
- [x] Unit, integration, E2E, contract, security, and BDD coverage planned for all remediated paths.
- [x] Linting and typechecking remain mandatory release gates with zero errors.
- [x] Accessibility audits planned with Lighthouse accessibility target ≥ 95 plus manual WCAG 2.2 AA checks for modal behavior, focus flow, contrast, typography, and keyboard navigation.
- [x] Documentation updates identified across specs, quickstart guidance, API contract artifacts, and targeted remediation notes.

Post-design gate review:

- [x] No constitutional violation requires a rewrite or parallel architecture.
- [x] The plan keeps provider-specific payment work behind the existing payment abstraction and extends current flows instead of replacing them.
- [x] Audit and regression evidence are explicit deliverables, satisfying the platform-overhaul governance baseline.

## Project Structure

### Documentation (this feature)

```text
specs/003-journey-hardening-remediation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md            # Created later by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── admin/
│   ├── api/
│   │   ├── admin/
│   │   ├── availability/
│   │   ├── bookings/
│   │   ├── payment-intents/
│   │   └── services/
│   └── book/
├── components/
│   ├── admin/
│   ├── booking/
│   ├── navigation/
│   └── payment/
├── lib/
│   ├── cache/
│   ├── schemas/
│   └── services/
└── workers/

tests/
├── contract/
├── e2e/
├── integration/
├── security/
└── unit/
```

**Structure Decision**: Use the existing single-project Next.js structure. This remediation touches current route handlers, customer booking components, admin pages, header/navigation components, Prisma-backed services, and the existing test pyramid. No additional package, app, or service boundary is introduced.

## Dependency Alignment

### 001-truflow-booking

- Reuse the current booking domain and public booking route structure.
- Treat session, event, and rental completion as missing or incomplete variants of the existing bookable offering flow, not as a new product line.
- Preserve the existing Stripe-based immediate-payment path while extending the final step to present payment choices clearly.

### 001-unified-navigation

- Reuse the current unified header and mobile navigation work already implemented in `src/components/Header.tsx` and related stories/tests.
- Limit scope to remediation of modal semantics, focus handling, close affordance, admin action visibility, branding placement, and low-vision readability gaps.

### 002-platform-overhaul

- Keep accessibility, documentation, OpenAPI coverage, Storybook coverage, CI validation, and release evidence as explicit delivery requirements.
- Add remediation-specific audit evidence rather than redefining the governance baseline.

## Implementation Phases

### Phase 0: Discovery And Reachability Audit

Purpose:

- verify the current public and admin surface before changing behavior
- identify which flows are already complete, partially complete, or unreachable
- confirm whether session, event, and rental are already modeled as services, require seeded data, or need a minimal taxonomy extension

Key work:

- build a route and entry-point audit matrix covering homepage CTAs, booking list/detail pages, legacy or secondary links, and admin routes
- audit the current payment step to confirm where Stripe is assumed and where bank transfer must be added
- verify the real admin path coverage for dashboard, services, business hours, date overrides, bookings, and admin management
- run accessibility and visual discovery on header, hamburger menu, modal behavior, contrast, typography, and logo treatment
- inspect existing Playwright, integration, contract, and Storybook coverage to identify regression gaps

Outputs:

- `research.md`
- audited remediation backlog grouped by customer journey, payment, admin authz, navigation/accessibility, branding, and test coverage

### Phase 1: Customer Journey Completion

Purpose:

- make every supported customer booking journey reachable end to end from valid entry points

Key work:

- normalize public entry points for session, event, and rental journeys using the existing booking route and service catalog where possible
- resolve dead-end or missing route transitions from catalog to selection, details, payment choice, and success states
- preserve entered customer details and provide recovery messaging for recoverable failures
- verify availability handling and unavailable-item recovery for each journey variant

Minimal-change bias:

- prefer extending the current `ServiceCard`, `BookPage`, `ServiceBookingPage`, and `BookingFlow` composition before creating new parallel route trees

### Phase 2: Payment Choice Presentation And Booking Outcome States

Purpose:

- make payment choice explicit at the end of each booking flow and distinguish paid vs pending transfer outcomes

Key work:

- insert or refactor the final checkout step so the customer can choose immediate payment or bank transfer before commitment
- preserve the existing Stripe payment-intent path for immediate payment
- add bank transfer instructions, booking reservation messaging, and admin-visible follow-up state
- extend booking state representation only as needed to differentiate card-complete, bank-transfer-pending, and corrective-action outcomes
- update impacted API contracts, schemas, and admin list/detail views

Discovery checkpoints:

- confirm whether a new booking payment method/state field is sufficient or whether a separate payment-status field is required
- confirm whether bank transfer instructions can be configuration-driven from existing settings or need a narrowly scoped settings addition

### Phase 3: Admin Reachability And Authorization Hardening

Purpose:

- ensure authenticated admins can reach and complete operational workflows while non-admins are denied before protected content renders

Key work:

- consolidate admin authorization checks across `proxy.ts`, route handlers, and any server-rendered admin pages
- verify dashboard reachability and fix broken data loading or route transitions without redesigning the dashboard IA
- validate services, business hours, date overrides, bookings, and admin management workflows end to end
- remove any public-facing admin affordances and confirm stale, bookmarked, refreshed, and direct admin URLs all enforce access consistently

Minimal-change bias:

- strengthen the current proxy matcher and shared auth/session helpers rather than adding a second guard framework

### Phase 4: Navigation Modal, Branding, And Accessibility Remediation

Purpose:

- remediate the unified header where current behavior falls short of modal accessibility, brand treatment, or low-vision usability

Key work:

- convert the mobile hamburger experience into true modal/dialog behavior with focus trap, escape handling, dismiss behavior, and focus return
- replace ambiguous close affordances with a standard accessible X icon
- complete open/close transitions so the control state is never visually ambiguous
- swap the primary header brand mark to the approved TruFlow logo on the left of the title copy and remove the old hexagonal icon from primary-brand use
- tune color tokens, typography scale, focus styles, and status/message contrast across public and admin surfaces most affected by this feature

Discovery checkpoints:

- verify whether existing Tailwind tokens are sufficient for contrast remediation or whether a small theme token cleanup in globals/header/admin components is needed
- verify whether modal behavior should reuse an existing MUI primitive or stay custom with targeted accessibility support

### Phase 5: Coverage, Regression Protection, And Release Evidence

Purpose:

- make the remediation durable and release-safe

Key work:

- add BDD coverage for session, event, and rental completion plus payment-choice outcomes and admin access rules
- extend Playwright coverage for reachability, completion, admin denial, dashboard reachability, and modal navigation behavior
- extend integration and contract coverage for booking-state transitions, bank-transfer pending state, availability blocking, and admin authorization enforcement
- update Storybook stories for header/navigation, payment choice UI, and any booking/admin status components changed by the work
- collect regression evidence for aligned specs 001 and 002, including accessibility review and route audit completion

## Risks And Mitigations

- **Risk**: Session, event, and rental may not yet be distinguished in the current data model.
  **Mitigation**: Audit seeded and production-like service data first; add only a narrow offering taxonomy field if route and content reuse is insufficient.
- **Risk**: Bank transfer support could leak into a larger payment-platform redesign.
  **Mitigation**: Keep the change limited to payment-choice presentation, booking outcome semantics, and admin follow-up visibility.
- **Risk**: Admin protection may be inconsistent between route handlers and server-rendered pages.
  **Mitigation**: centralize guard behavior and explicitly test direct URL, refresh, expired session, and in-app navigation cases.
- **Risk**: Contrast fixes in one surface may regress another.
  **Mitigation**: target shared tokens and add regression coverage for header, booking, and admin routes.

## Complexity Tracking

No justified constitutional violations are required for this plan.
