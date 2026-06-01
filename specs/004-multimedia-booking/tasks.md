# Tasks: Multimedia Booking Experience

**Input**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [research.md](research.md)

## Format: [ID] [P?] [Story] Description

- **[P]**: Parallelizable task after dependencies are met.
- **[Story]**: Story mapping from spec (`US1`..`US4`).

## Phase 1 - Spec Finalization

- [ ] T001 Finalize acceptance criteria, scope boundaries, and fallback behavior in [spec.md](spec.md).
- [ ] T002 Confirm data model decisions and field names in [data-model.md](data-model.md).
- [ ] T003 Resolve open questions and decisions in [research.md](research.md).
- [ ] T004 Define feature-local BDD scenarios for hero media, card media, admin authoring, and reduced-motion behavior in [bdd/media-booking.feature](bdd/media-booking.feature).
- [ ] T005 Define feature-local contract coverage for service media metadata in [contracts/openapi.yaml](contracts/openapi.yaml).

## Phase 2 - Contracts and Persistence

- [ ] T006 [P] Add contract tests for media fields in [../../tests/contract/services.test.ts](../../tests/contract/services.test.ts).
- [ ] T007 Extend service schema with optional media fields in [../../prisma/schema.prisma](../../prisma/schema.prisma).
- [ ] T008 Create migration for media fields in [../../prisma/migrations](../../prisma/migrations).
- [ ] T009 [P] Add optional media fixture data in [../../prisma/seed.ts](../../prisma/seed.ts).
- [ ] T010 Extend Zod entity and API schemas in [../../src/lib/schemas/entities.ts](../../src/lib/schemas/entities.ts) and [../../src/lib/schemas/api.ts](../../src/lib/schemas/api.ts).
- [ ] T011 Update admin service create and update endpoints in [../../src/app/api/admin/services/route.ts](../../src/app/api/admin/services/route.ts) and [../../src/app/api/admin/services/[id]/route.ts](../../src/app/api/admin/services/[id]/route.ts).
- [ ] T011a Add upload handling path for admin media authoring and store resolved media URLs in service records.

## Phase 3 - Admin Authoring

- [ ] T012 Add media metadata fields and validation UI in [../../src/components/admin/ServiceForm.tsx](../../src/components/admin/ServiceForm.tsx).
- [ ] T013 Verify list and edit flow consistency in [../../src/components/admin/ServiceList.tsx](../../src/components/admin/ServiceList.tsx) and [../../src/app/admin/services/page.tsx](../../src/app/admin/services/page.tsx).
- [ ] T014 Add admin integration coverage for valid/invalid media payloads in tests under [../../tests/integration](../../tests/integration).
- [ ] T014a Ensure admin UX is upload-only for v1 (no direct URL entry mode).

## Phase 4 - Hero Media Rendering

- [ ] T015 Add hero media rendering path on booking surfaces in [../../src/app/book/page.tsx](../../src/app/book/page.tsx) and/or [../../src/app/book/[serviceId]/page.tsx](../../src/app/book/[serviceId]/page.tsx).
- [ ] T015a Limit hero media to per-service rendering for v1.
- [ ] T016 Implement reusable fade-to-white styling below hero text in [../../src/app/globals.css](../../src/app/globals.css).
- [ ] T017 Add fallback behavior for missing/failed hero media and reduced-motion behavior.
- [ ] T017a Use neutral placeholder gradient fallback and disable autoplay/animation under reduced-motion.

## Phase 5 - Card Banner Rendering

- [ ] T018 Extend card media rendering in [../../src/components/booking/ServiceCard.tsx](../../src/components/booking/ServiceCard.tsx).
- [ ] T019 Implement fade-to-white below service title and above details content.
- [ ] T020 Preserve existing duration badges, pricing, and CTA behavior.

## Phase 6 - Tests and Visual Coverage

- [ ] T021 Extend component tests in [../../src/components/booking/ServiceCard.test.tsx](../../src/components/booking/ServiceCard.test.tsx).
- [ ] T022 Add or extend booking-flow e2e assertions in [../../tests/e2e/booking-flow.spec.ts](../../tests/e2e/booking-flow.spec.ts).
- [ ] T023 Add Storybook states (no-media, image, gif, video, reduced-motion) in [../../src/components/booking/ServiceCard.stories.tsx](../../src/components/booking/ServiceCard.stories.tsx) and related stories under [../../src/stories](../../src/stories).
- [ ] T024 Document verification results in [quickstart.md](quickstart.md).
- [ ] T024a Add strict media-limit validation tests for size, resolution, and video duration.

## Phase 7 - Quality Gates and Handoff

- [ ] T025 Run lint/type/unit/contract/e2e/build gates.
- [ ] T026 Capture rollout and regression evidence in [quickstart.md](quickstart.md).
- [ ] T027 Prepare merge summary and release notes.
- [ ] T028 Record Lighthouse baseline and verify booking-route regression is no more than 2 points.

## Suggested Parallel Workstreams

1. Contracts/persistence stream: T004 to T009.
2. Admin authoring stream: T012 to T014 (after schema/API updates stabilize).
3. Customer rendering stream: T015 to T020 (after schema/API updates stabilize).
4. Verification stream: T021 to T027.
