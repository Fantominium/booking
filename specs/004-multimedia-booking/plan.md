# Implementation Plan: Multimedia Booking Experience

**Branch**: `004-multimedia-booking` | **Date**: 2026-06-01 | **Spec**: [spec.md](spec.md)

## Summary

This feature introduces multimedia rendering in customer-facing booking surfaces and admin media authoring support. The implementation strategy is additive and non-breaking:

1. Define contracts and persistence for optional media metadata.
2. Enable admin configuration and validation.
3. Render hero and card media with required fade behavior.
4. Verify accessibility, reduced-motion behavior, and performance expectations.

## Technical Context

- **Framework**: Next.js App Router with TypeScript strict mode.
- **Persistence**: Prisma + PostgreSQL.
- **Validation**: Zod schemas in API/entity boundaries.
- **Styling**: Tailwind + global CSS tokens and utilities.
- **Testing**: Vitest unit/integration/contract, Playwright e2e, Storybook visual verification.

## Scope

### In Scope

- Hero media (image/video) on booking surfaces.
- Per-service hero media only for v1.
- Service card banner media (image/gif).
- Fade-to-white behavior below hero text and below card title.
- Admin media metadata configuration.
- Admin upload-based media authoring for v1.
- Contract and schema updates.
- Accessibility and reduced-motion compliance checks.

### Out of Scope

- Full media asset management platform or CMS lifecycle tooling.
- Payment flow redesign.
- Unrelated navigation or branding rewrites.

## Existing Reuse Points

- Booking catalog: [../../src/app/book/page.tsx](../../src/app/book/page.tsx)
- Service booking page: [../../src/app/book/[serviceId]/page.tsx](../../src/app/book/[serviceId]/page.tsx)
- Service card component: [../../src/components/booking/ServiceCard.tsx](../../src/components/booking/ServiceCard.tsx)
- Booking flow orchestration: [../../src/components/booking/BookingFlow.tsx](../../src/components/booking/BookingFlow.tsx)
- Booking pages read service records directly from Prisma in server components, so media rendering should be implemented at those surfaces rather than via a new customer-facing API.
- Admin service form: [../../src/components/admin/ServiceForm.tsx](../../src/components/admin/ServiceForm.tsx)
- Admin service routes: [../../src/app/api/admin/services/route.ts](../../src/app/api/admin/services/route.ts), [../../src/app/api/admin/services/[id]/route.ts](../../src/app/api/admin/services/[id]/route.ts)
- Shared schemas: [../../src/lib/schemas/entities.ts](../../src/lib/schemas/entities.ts), [../../src/lib/schemas/api.ts](../../src/lib/schemas/api.ts)
- Styling foundation: [../../src/app/globals.css](../../src/app/globals.css)

## Phased Execution

### Phase 1 - Discovery and Contract Definition

1. Confirm final media metadata model.
2. Lock acceptance criteria and fallback behavior.
3. Write BDD feature coverage for hero media, card banners, admin authoring, and accessibility/motion behavior.
4. Write failing/updated contract tests for service payloads and media metadata.
5. Capture any API-contract artifact needed for schema parity under the feature-local contracts folder.

### Phase 2 - Persistence and API

1. Extend Prisma service model.
2. Add migration and seed-safe defaults.
3. Update Zod schemas and admin service endpoints.
4. Add upload processing path used by admin authoring and persist resolved media URLs to `Service`.
4. Keep booking-page rendering on server components that already query Prisma directly.

### Phase 3 - Admin Authoring

1. Add media fields to admin service form.
2. Add validation, preview, and error handling.
3. Ensure service list and edit flows remain stable.

### Phase 4 - Customer Hero Media

1. Render hero media on booking pages.
2. Add fade-to-white beneath hero text.
3. Add fallback strategy for missing/failed media.

### Phase 5 - Customer Card Banner Media

1. Extend service card to show banner media.
2. Place fade transition below title region.
3. Preserve current interaction behavior.

### Phase 6 - Hardening and Verification

1. Validate reduced-motion behavior.
2. Add/extend unit, integration, and e2e coverage.
3. Add Storybook states for no-media/media variants.
4. Add or update BDD and contract artifacts alongside executable tests.
5. Final accessibility and performance checks.
6. Verify Lighthouse score drop on affected booking routes is no more than 2 points.

## Dependency Order

1. Contract and schema work must complete before UI authoring and rendering.
2. Admin and customer UI tracks can proceed in parallel after contracts stabilize.
3. Hardening and verification require all rendering changes to be merged.

## Risks and Mitigations

- **Risk**: Media data introduces regressions in existing cards.
  - **Mitigation**: Optional fields only, strong fallbacks, no-media regression tests.
- **Risk**: Poor readability over media.
  - **Mitigation**: Required overlays/fades and contrast checks.
- **Risk**: Motion sensitivity issues with video/gif.
  - **Mitigation**: Reduced-motion path and static fallback behavior.
- **Risk**: Admin misconfiguration.
  - **Mitigation**: strict schema validation and explicit admin form guidance.

## Quality Gates

Run and pass:

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm test:e2e`
5. `pnpm build`
