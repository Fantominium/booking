# 004 Multimedia Booking: Merge Summary and Release Notes

## Merge Summary

Feature scope delivered on branch `004-multimedia-booking`:

1. Added multimedia persistence support for services (hero and card media metadata) in Prisma schema, migration, and seed paths.
2. Extended validation and API contracts to support media fields with conditional rules (alt text, decorative mode, hero video poster requirements).
3. Implemented admin upload-only media authoring flow, including media upload endpoint and hard validation limits.
4. Added customer-facing media rendering for service hero and card surfaces, including fallback placeholders and reduced-motion behavior.
5. Expanded verification coverage across contract, integration, unit, story, and e2e tests for multimedia behavior.

## Release Notes

### Added

1. Service hero media support with `IMAGE` and `VIDEO` handling.
2. Service card media support with `IMAGE` and `GIF` handling.
3. Upload endpoint for admin media assets at `/api/admin/services/media`.
4. Shared media-limit constants for server/client validation parity.
5. `MediaSurface` component for resilient media rendering and graceful fallback.

### Changed

1. Admin service create and update workflows now include media metadata fields.
2. Booking service card and service-detail pages now render optional media with accessible fallback behavior.
3. Header navigation tests and selectors were aligned to current menu/theme-toggle behavior.

### Fixed During Gate Remediation

1. Lint/security blockers in media upload and admin update paths.
2. Header and breadcrumb test regressions introduced by navigation behavior drift.
3. Checkout default payment expectation mismatch in unit tests.
4. Webhook security test timeout sensitivity.

## Gate Status Snapshot (2026-06-02)

1. `pnpm lint`: PASS
2. `pnpm typecheck`: PASS
3. `pnpm test`: PASS
4. `pnpm test:coverage`: PASS
5. `pnpm test:e2e`: PASS (28 passed, 11 skipped)
6. `pnpm build`: PASS
7. `pnpm exec lefthook run pre-commit --all-files`: PASS

## Known Follow-up

1. Lighthouse booking-route regression requirement (T028) remains open pending agreed pre-feature baseline comparison and optimization follow-up.
