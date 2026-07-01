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

## Verification Evidence (2026-06-02)

Implementation snapshot:

- Branch: `004-multimedia-booking`
- Commit: `30d5ded`

Executed commands and outcomes:

1. `pnpm prisma migrate deploy`
   - Result: PASS
   - Notes: Applied migration `20260601113000_add_service_media_fields`.

2. `pnpm typecheck`
   - Result: PASS

3. `pnpm vitest run tests/integration/admin-service-media-upload.test.ts`
   - Result: PASS
   - Evidence: 5 tests passed (unauthorized access, invalid slot, duration limit, resolution limit, valid upload success).

4. `pnpm playwright test tests/e2e/booking-flow.spec.ts --project=chromium`
   - Result: PASS
   - Evidence: 4 tests passed, including hero media rendering and reduced-motion assertions.

5. `pnpm lint`
   - Result: PASS

6. `pnpm test`
   - Result: PASS
   - Evidence: 54 test files passed, 1 skipped; 148 tests passed, 13 skipped.

7. `pnpm test:coverage`
   - Result: PASS
   - Evidence: 54 test files passed, 1 skipped; V8 coverage generated successfully.

8. `pnpm test:e2e`
   - Result: PASS
   - Evidence: 39 specs executed; 28 passed, 11 skipped.

9. `pnpm build`
   - Result: PASS

10. `pnpm exec lefthook run pre-commit --all-files`
    - Result: PASS
    - Evidence: pre-commit hook completed with lint passing.

11. `pnpm exec lighthouse` on booking routes (performance category)

- Result: PASS
- Evidence:
  - Initial measurement: `/book` 84, `/book/[serviceId]` 83, `/book/success` 99
  - Post-optimization measurement: `/book` 92, `/book/[serviceId]` 97
  - `/book/success`: 99
- Baseline comparison: using existing documented baseline estimate of 94 in `docs/ACCESSIBILITY_PERFORMANCE.md`, the final booking-route scores satisfy the allowed 2-point regression budget (`/book` is down 2 points; `/book/[serviceId]` improved over baseline).
- Optimization notes: moved MUI theme wiring off the global app shell and reduced `/book` card-grid hydration by splitting the interactive option selector into its own client component.

12. Merge summary and release notes

- Result: PASS
- Evidence: documented in [release-notes.md](release-notes.md).

## Task Progress Snapshot

Completed in this implementation window:

- T006, T007, T008, T009, T010, T011, T011a
- T012, T013, T014, T014a
- T015, T015a, T016, T017, T017a
- T018, T019, T020
- T021, T022, T023, T024, T024a, T026

Pending quality and release gates:

- T025: complete (all configured gates executed and passing: `lint`, `typecheck`, `test`, `test:coverage`, `test:e2e`, `build`, and `pre-commit`).
- T027: complete (merge summary and release notes added in [release-notes.md](release-notes.md)).
- T028: complete (final Lighthouse booking-route scores satisfy the <= 2 point regression budget).
