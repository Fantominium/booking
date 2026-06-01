# Research: Multimedia Booking Experience

## Existing System Findings

1. Booking catalog and cards already centralize through [../../src/app/book/page.tsx](../../src/app/book/page.tsx) and [../../src/components/booking/ServiceCard.tsx](../../src/components/booking/ServiceCard.tsx).
2. Service-specific booking views are rooted in [../../src/app/book/[serviceId]/page.tsx](../../src/app/book/[serviceId]/page.tsx).
3. Admin service authoring is already consolidated in [../../src/components/admin/ServiceForm.tsx](../../src/components/admin/ServiceForm.tsx).
4. Styling uses shared gradient and transition patterns in [../../src/app/globals.css](../../src/app/globals.css).
5. Service entity currently has no dedicated media fields and requires additive schema extension.

## Design Decisions

1. Use optional media metadata fields in `Service` instead of introducing a separate media table for first iteration.
2. Use admin upload workflow in v1 and persist resolved media URLs/metadata on `Service`.
3. Keep fade behavior implemented via reusable CSS/tokenized classes, not one-off per component styling.
4. Preserve current no-media card and hero behavior as fallback baseline.
5. Respect reduced-motion preference by avoiding non-essential motion-heavy transitions.
6. Hero media scope for v1 is per-service only.
7. Fallback style for missing/failed media is a neutral placeholder gradient.

## Accessibility Decisions

1. Ensure text over hero media always has contrast-preserving overlay support.
2. Require alt text unless media is explicitly marked decorative.
3. Avoid introducing keyboard traps; media must not interfere with focus navigation.
4. Validate mobile and desktop readability and interactive target compliance.
5. Under reduced-motion preference, disable autoplay and animation and show static fallback media.

## Performance Decisions

1. Start with optimized static/image assets and controlled gif/video usage.
2. Prefer deferred loading for non-critical media when possible.
3. Monitor booking route payload size and render cost during rollout.
4. Enforce strict hard limits for media size, resolution, and video duration.
5. Release gate requires booking-route Lighthouse score regression to be no more than 2 points from baseline.

## Resolved Decisions

1. Admin media input mode: upload-only for v1.
2. Hero scope: per-service only for v1.
3. Media validation policy: strict hard limits.
4. Alt-text policy: required unless decorative.
5. Reduced-motion policy: disable autoplay and animation.
6. Fallback visual policy: neutral placeholder gradient.
7. `mediaOverlayTheme` field: deferred from v1.
8. Performance gate: Lighthouse booking-route regression <= 2 points.
