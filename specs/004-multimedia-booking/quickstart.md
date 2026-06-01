# Quickstart: Multimedia Booking Experience

## Purpose

This runbook provides the execution order for implementing and validating multimedia booking support.

## Prerequisites

1. Branch checked out: `004-multimedia-booking`.
2. Local dependencies installed.
3. Database and seed environment available.

## Recommended Execution Order

1. Finalize feature artifacts:
   - [spec.md](spec.md)
   - [plan.md](plan.md)
   - [data-model.md](data-model.md)
   - [research.md](research.md)
   - [tasks.md](tasks.md)
   - [bdd/media-booking.feature](bdd/media-booking.feature)
   - [contracts/openapi.yaml](contracts/openapi.yaml)

2. Implement schema and contract updates first:
   - [../../prisma/schema.prisma](../../prisma/schema.prisma)
   - [../../src/lib/schemas/entities.ts](../../src/lib/schemas/entities.ts)
   - [../../src/lib/schemas/api.ts](../../src/lib/schemas/api.ts)
   - [../../src/app/api/admin/services/route.ts](../../src/app/api/admin/services/route.ts)
   - [../../src/app/api/admin/services/[id]/route.ts](../../src/app/api/admin/services/[id]/route.ts)

3. Implement admin media authoring:
   - [../../src/components/admin/ServiceForm.tsx](../../src/components/admin/ServiceForm.tsx)
   - [../../src/components/admin/ServiceList.tsx](../../src/components/admin/ServiceList.tsx)

4. Implement customer-facing rendering:
   - [../../src/app/book/page.tsx](../../src/app/book/page.tsx)
   - [../../src/app/book/[serviceId]/page.tsx](../../src/app/book/[serviceId]/page.tsx)
   - [../../src/components/booking/ServiceCard.tsx](../../src/components/booking/ServiceCard.tsx)
   - [../../src/app/globals.css](../../src/app/globals.css)

5. Implement test and visual coverage:
   - [../../tests/contract/services.test.ts](../../tests/contract/services.test.ts)
   - [bdd/media-booking.feature](bdd/media-booking.feature)
   - [contracts/openapi.yaml](contracts/openapi.yaml)
   - [../../src/components/booking/ServiceCard.test.tsx](../../src/components/booking/ServiceCard.test.tsx)
   - [../../tests/e2e/booking-flow.spec.ts](../../tests/e2e/booking-flow.spec.ts)
   - [../../src/components/booking/ServiceCard.stories.tsx](../../src/components/booking/ServiceCard.stories.tsx)

## Validation Commands

Run in this order:

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm test:coverage`
5. `pnpm test:e2e`
6. `pnpm build`
7. `pnpm exec lefthook run pre-commit --all-files`

## Manual Verification Checklist

1. Hero media renders and text remains readable on mobile and desktop.
2. Hero fades into white below hero text.
3. Service card media renders and fades into white below service title.
4. Cards without media still render old behavior.
5. Admin can create and edit media fields.
6. Reduced-motion preference is respected.
7. No booking flow regressions in selection, availability, checkout, and success.
8. BDD scenarios and contract artifacts reflect the implemented media behavior.
9. Admin authoring is upload-only for v1.
10. Hero media behavior is per-service only for v1.
11. Lighthouse performance regression on booking routes is no more than 2 points.

## Handoff Checklist

1. All task IDs completed or deferred with reason.
2. Test evidence captured.
3. Accessibility/performance notes recorded.
4. PR summary references this spec folder.
