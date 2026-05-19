# Research: TruFlow Journey Hardening Remediation

## R-001: How should the remediation be sequenced against the current codebase?

**Decision**: Use an audit-first remediation sequence: reachability audit first, then customer journey fixes, then payment-choice and admin hardening, then header/accessibility remediation, and finally regression coverage.

**Rationale**: The repository already has a working Next.js booking surface, existing admin pages, and a unified header implementation. The highest risk is not missing architecture, it is incomplete or inconsistent behavior across real routes. An audit-first sequence prevents speculative redesign and keeps changes focused.

**Alternatives considered**:

- Rewrite the booking and admin flows together: rejected because it duplicates existing work and increases regression risk.
- Start with visual/header fixes first: rejected because reachability and authorization gaps are higher-severity failures.

## R-002: How should session, event, and rental journeys be modeled?

**Decision**: Reuse the existing `Service` and `Booking` domain as the primary implementation path, and only add a narrow offering taxonomy field if the audit shows the current catalog cannot distinguish session, event, and rental journeys cleanly.

**Rationale**: The current schema already supports bookable offerings, availability, and bookings. A minimal taxonomy extension is far less risky than creating parallel booking models for each journey type.

**Alternatives considered**:

- Create separate persisted models for sessions, events, and rentals: rejected because it would turn remediation into domain redesign.
- Treat the three journeys as purely content-level labels with no audit verification: rejected because the plan must account for real route and data reachability.

## R-003: How should payment choice be introduced without breaking the existing Stripe flow?

**Decision**: Refactor the final step of `BookingFlow` so the customer explicitly selects a payment choice before commitment. Preserve the current Stripe payment-intent path for immediate payment and add a bank-transfer path that creates a reserved or pending booking outcome with explicit instructions.

**Rationale**: The current booking flow already creates a booking and Stripe client secret. Extending that final step preserves the existing payment provider integration while adding the clarity and pending-state semantics required by the spec.

**Alternatives considered**:

- Add bank transfer as an offline note after Stripe confirmation: rejected because it does not present payment choices before commitment.
- Build a separate bank-transfer checkout route: rejected because it adds route complexity and duplicates the existing flow.

## R-004: What is the minimal safe way to harden admin authorization?

**Decision**: Strengthen the existing admin protection path centered on `proxy.ts`, NextAuth session evaluation, and admin route handlers, and add explicit denial coverage for direct URL access, refresh, bookmark, and expired-session scenarios.

**Rationale**: Admin routes are already grouped under `/admin` and `/api/admin`. Reusing that boundary avoids parallel authorization code paths and directly addresses the most likely inconsistency points.

**Alternatives considered**:

- Introduce a new role/permissions framework: rejected because the scope calls for focused hardening, not a new auth system.
- Rely on client-only hiding of admin links: rejected because the specification requires denial before protected content renders.

## R-005: How should admin dashboard reachability be remediated?

**Decision**: Treat admin reachability as a workflow-completion problem on top of the current pages and APIs. Verify `dashboard`, `services`, `business-hours`, `date-overrides`, `bookings`, and `admins` routes and fix the concrete failures discovered by audit.

**Rationale**: The admin dashboard and major management routes already exist. The plan should improve operational completeness rather than redesign the admin IA.

**Alternatives considered**:

- Rebuild the dashboard around a new navigation system: rejected because it duplicates 001-unified-navigation and widens the scope.
- Limit work to public-route hardening only: rejected because admin operational reachability is a P1 requirement.

## R-006: How should the hamburger menu remediation be implemented?

**Decision**: Convert the mobile menu into a true modal navigation experience with managed focus, escape-to-close, focus return, and a standard accessible X close control. Prefer an existing accessible primitive already in the stack if it keeps the change smaller than maintaining a custom focus-trap implementation.

**Rationale**: The current header uses an expandable in-page menu pattern. The specification requires modal behavior, and the repository already permits MUI for complex interaction primitives.

**Alternatives considered**:

- Keep the current hidden-section menu and improve animation only: rejected because it does not satisfy the modal requirement.
- Add a new animation library: rejected because the dependency cost is unnecessary for this remediation.

## R-007: How should contrast, typography, and branding be remediated?

**Decision**: Apply shared token and component-level adjustments to header, navigation, booking, and admin surfaces, and swap the primary header brand presentation to the approved TruFlow logo plus title treatment.

**Rationale**: Contrast or typography regressions are likely caused by shared styles rather than isolated pages. Token-level fixes plus targeted component updates are the smallest durable remediation.

**Alternatives considered**:

- Patch each page independently: rejected because it increases inconsistency and regression risk.
- Perform a full design-system overhaul: rejected because this feature is a remediation track, not a visual redesign initiative.

## R-008: How should coverage be expanded to satisfy the constitution and this spec?

**Decision**: Extend the existing test pyramid instead of introducing a parallel harness: use Playwright for end-to-end reachability and flow completion, Vitest integration/contract/security suites for state and guard behavior, Storybook for UI states, and feature-level BDD acceptance artifacts for human-readable scenario coverage.

**Rationale**: The repository already has broad coverage directories and navigation-related E2E tests. Extending those suites produces the least operational friction and the strongest regression signal.

**Alternatives considered**:

- Add a separate BDD framework immediately: rejected because it is unnecessary to plan the remediation and may expand scope.
- Rely only on manual QA checklists: rejected because the specification explicitly requires executable regression coverage.

## R-009: How should API contract coverage be represented given the current repository state?

**Decision**: Create a feature-local OpenAPI artifact for the endpoints touched by this remediation and treat merging those paths into the canonical repository contract as part of implementation completion.

**Rationale**: The constitution requires API coverage, but the repository does not currently expose a single live `spec/openapi.yaml` artifact. A feature-local contract keeps planning concrete without blocking on unrelated repo cleanup.

**Alternatives considered**:

- Skip the contract because endpoints already exist: rejected because it conflicts with the constitution and platform-overhaul expectations.
- Attempt to reconstruct the entire repository API spec in this feature plan: rejected because it is beyond the requested scope.
