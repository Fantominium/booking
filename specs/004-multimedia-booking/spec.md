# Feature Specification: Multimedia Booking Experience

**Feature Branch**: `004-multimedia-booking`  
**Created**: 2026-06-01  
**Status**: Draft  
**Input**: Add multimedia support to booking page and service cards (hero video/image plus card gif/image banners with seamless fade into white content area).

## User Scenarios and Testing

### User Story 1 - Customer Sees Hero Media On Booking Surfaces (Priority: P1)

As a customer, I want the booking page hero section to include media (video or image) so the experience is more engaging while still readable and easy to navigate.

**Why this priority**: Hero media is the top-level visual requirement and sets the layout constraints for downstream card and content behavior.

**Independent Test**: A tester can open booking pages on mobile and desktop and confirm hero media renders with readable hero text and a fade transition into the white content section.

**Acceptance Scenarios**:

1. **Given** hero media is configured, **when** a customer opens the booking page, **then** the hero displays configured media with readable text.
2. **Given** hero media is missing or fails to load, **when** the page renders, **then** a stable fallback appears and page content remains usable.
3. **Given** hero text is shown on top of media, **when** the user reads the section, **then** contrast remains WCAG 2.2 AA compliant.
4. **Given** the hero section transitions into content, **when** the section ends, **then** a seamless fade into white appears below hero text.

---

### User Story 2 - Customer Sees Service Card Banner Media (Priority: P1)

As a customer, I want each service card to support a banner gif or image so products are visually descriptive without reducing clarity of booking details.

**Why this priority**: Card media is the direct product-level requirement and affects browse-to-book conversion.

**Independent Test**: A tester can view mixed service cards (with and without media) and verify banners render consistently and fade into the white card body below the service title.

**Acceptance Scenarios**:

1. **Given** card media is configured, **when** service cards load, **then** banner media appears above service details.
2. **Given** card media exists, **when** the title and details area begins, **then** the banner fades into white below the title region.
3. **Given** a service has no card media, **when** the card renders, **then** the existing card layout remains functional and visually stable.
4. **Given** card media is a gif, **when** displayed, **then** text and interactive controls remain legible and operable.

---

### User Story 3 - Admin Configures Service Media Safely (Priority: P1)

As an admin, I want to configure hero and card media in service management so content can be updated without code changes.

**Why this priority**: Admin authoring is required to make the feature maintainable post-release.

**Independent Test**: An admin can create or edit a service with media metadata, save successfully, and see the updated media on booking surfaces.

**Acceptance Scenarios**:

1. **Given** an admin edits a service, **when** they enter supported media metadata, **then** the service saves and renders media in booking views.
2. **Given** invalid media metadata (type, url, or alt text), **when** save is attempted, **then** validation errors are returned.
3. **Given** a service uses no media, **when** admin updates non-media fields, **then** existing behavior remains unchanged.

---

### User Story 4 - Accessibility, Motion, And Performance Remain Compliant (Priority: P1)

As a customer, including low-vision and motion-sensitive users, I want multimedia behavior to remain accessible and performant.

**Why this priority**: The project has explicit accessibility and performance compliance goals that must not regress.

**Independent Test**: A tester can verify reduced-motion behavior, keyboard and screen-reader compatibility, and no critical Lighthouse accessibility regression on affected pages.

**Acceptance Scenarios**:

1. **Given** a user prefers reduced motion, **when** booking pages render, **then** media transitions and autoplay behavior are reduced or replaced by static fallback behavior.
2. **Given** media overlays are present, **when** text and controls are viewed, **then** color contrast remains compliant.
3. **Given** media-enabled pages load, **when** performance checks run, **then** the feature remains within agreed performance limits.

## Requirements

### Functional Requirements

- **FR-001**: The booking experience MUST support hero media on booking surfaces using either image or video.
- **FR-002**: Service cards MUST support banner media using image or gif.
- **FR-002a**: Hero media scope for v1 MUST be per-service only.
- **FR-003**: Hero media MUST fade into a white content background below hero text.
- **FR-004**: Service card media MUST fade into a white card background below service title.
- **FR-005**: The system MUST support services with and without media without breaking existing booking flows.
- **FR-006**: Admin service management MUST support create and update of media metadata.
- **FR-006a**: Admin media input for v1 MUST use upload-based authoring (no direct URL entry mode in UI).
- **FR-007**: Media metadata MUST be validated at API boundaries.
- **FR-008**: Accessibility metadata (for example alt text where required) MUST be supported and validated.
- **FR-009**: Reduced-motion preferences MUST be respected in multimedia rendering.
- **FR-010**: Existing booking journey behavior (selection, availability, checkout, confirmation) MUST remain intact.
- **FR-011**: If reduced-motion is enabled, autoplay and animation for media MUST be disabled and static fallback media must be shown.
- **FR-012**: Fallback rendering for missing or failed media MUST use a neutral placeholder gradient treatment.
- **FR-013**: Media validation MUST enforce strict hard limits for file size, resolution, and (for video) duration.

### Non-Functional Requirements

- **NFR-001**: New UI must support both light and dark themes already present in the application.
- **NFR-002**: Multimedia rendering must not introduce critical accessibility violations.
- **NFR-003**: Multimedia rendering must not introduce unacceptable performance regressions on booking routes.
- **NFR-004**: All new code must conform to repository code style and strict typing rules.
- **NFR-005**: Lighthouse performance score on affected booking routes MUST not drop by more than 2 points from pre-feature baseline.

## Key Entities

- **Service**: Existing bookable offering extended with optional media metadata fields.
- **Hero Media**: Visual asset associated with booking hero context, supporting image or video and fallback handling.
- **Card Banner Media**: Visual asset associated with a service card, supporting image or gif.
- **Media Presentation Rules**: Derived rendering behavior (fade position, overlay, fallback, reduced motion).

## Success Criteria

- **SC-001**: 100% of media-configured services render valid hero/card media without blocking booking interactions.
- **SC-002**: 100% of services without media continue to render correctly.
- **SC-003**: Fade behavior appears in the expected positions for hero and card sections across supported breakpoints.
- **SC-004**: Accessibility checks on affected routes show no critical regressions.
- **SC-005**: Contract, integration, unit, and end-to-end tests for affected surfaces pass in CI.
- **SC-006**: Lighthouse performance score regression on booking routes is at most 2 points from baseline.

## Definition of Done

- Spec, plan, data model, tasks, research, and quickstart artifacts are complete for this feature.
- Prisma schema, migration, and API contracts include optional media metadata.
- Admin service form supports media authoring with validation.
- Booking hero and service cards render media with required fade behavior and fallbacks.
- Reduced-motion and accessibility behavior is verified.
- Test and Storybook coverage exists for media and non-media cases.
- Project quality gates pass.
