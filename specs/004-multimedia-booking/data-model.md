# Data Model: Multimedia Booking Experience

## Overview

The feature extends the existing `Service` entity with optional media metadata. The model is additive to preserve compatibility with current services and booking journeys.

## Entity Changes

### Service (Extended)

Proposed optional fields:

- `heroMediaType`: enum (`IMAGE` | `VIDEO`) or nullable string enum equivalent.
- `heroMediaUrl`: nullable string.
- `heroMediaAltText`: nullable string.
- `heroPosterUrl`: nullable string (video fallback image).
- `cardMediaType`: enum (`IMAGE` | `GIF`) or nullable string enum equivalent.
- `cardMediaUrl`: nullable string.
- `cardMediaAltText`: nullable string.
- `isDecorative`: nullable boolean for future content-policy support, default null when unused.

## Validation Rules

1. Media URL fields must be valid URLs or approved internal asset paths.
2. `heroMediaType` and `cardMediaType` must match allowed values.
3. If media URL exists and `isDecorative` is false or unset, alt text is required.
4. Unsupported combinations are rejected (for example hero video with missing url).
5. Strict hard limits are enforced for file size, resolution, and video duration.
6. Empty media payloads are valid and preserve current behavior.

## API Contract Impact

### Affected Endpoints

- `GET /api/services`
- `POST /api/admin/services`
- `PATCH /api/admin/services/:id`

### Rendering Path Notes

1. Customer booking pages are server components that already read service rows directly from Prisma.
2. Media fields must therefore be available on the `Service` record itself, not only through a separate customer-facing endpoint.
3. Admin service endpoints remain the write path and the contract/validation boundary.

### Contract Notes

1. Read responses include nullable media fields where used.
2. Admin create and update requests accept optional media metadata.
3. Validation errors include field-level detail for media constraints.
4. Admin UI uses upload workflow; persisted `Service` fields store resulting media URLs and metadata.

## Migration Strategy

1. Add nullable columns first.
2. No backfill required for existing services.
3. Preserve all current rows and behavior when fields are null.
4. Seed updates may include sample media metadata for local testing only.

## UI Mapping

### Hero Rendering Inputs

- Source: service hero fields.
- Rendering priority: video (with poster) then image then fallback static layout.

### Card Rendering Inputs

- Source: service card media fields.
- Rendering priority: configured media then existing card layout.

## Backward Compatibility Guarantees

1. Services without media continue to render current layout.
2. Booking interactions, availability, and checkout are unchanged.
3. Admin can edit existing services without providing new media fields.
