<!-- 
SYNC IMPACT REPORT (Constitution v1.4.0)
==========================================
Integration: Added modular payments, documentation standards, deployment, and booking cap.
- Version: 1.3.0 → 1.4.0 (MINOR: Added deployment + payments modularity + admin booking cap)
- Status: Expanded operational and extensibility requirements
- Ratified: 2026-02-01
- Last Amended: 2026-02-02
- New Sections: Deployment & Hosting
- Tech Stack Additions: Modular payment provider interface
- Required Policies: Method documentation (purpose, params, return types)
- Domain Rules: Max bookings per day configurable by admin
- Templates aligned: ✅ plan-template.md, ✅ spec-template.md, ✅ tasks-template.md
- No breaking changes (additive only)
==========================================
-->

# Bookings Constitution

## Project Vision

Build a professional, high-trust booking platform for a massage therapy business that bridges the gap between customer convenience and administrative control. The system prioritizes a seamless "happy path" for customers—booking a single service with a down-payment—while providing the business owner with robust tools to manage availability and verify payments.

**Core Value Propositions**:

- **Simplicity**: One booking = One service. No complex carts or multi-day logic.
- **Reliability**: Zero double-bookings via atomic database transactions.
- **Transparency**: Clear pricing, down-payment rules, and instant confirmation (Email + ICS).

**Happy Path User Flow**:

1. Service selection with clear price and duration display
2. Calendar scheduling with disabled/unavailable dates grayed out
3. Simple form (Name, Email, Phone)
4. Stripe payment element for down-payment only
5. Success screen with email confirmation and `.ics` calendar file

## Core Principles

### I. Specification-Driven Development

Every feature begins with a written specification that captures user scenarios, acceptance criteria, and technical requirements. Specifications are approved before implementation begins. Implementation strictly follows the approved specification—deviations require specification amendment and re-approval.

### II. Test-First (NON-NEGOTIABLE)

Test cases are written and approved alongside the specification. Implementation follows TDD principles: tests written first (Red), implementation (Green), refactoring (Refactor). All production code requires corresponding test coverage including unit, integration, and end-to-end tests. Unit tests validate individual functions/components. Integration tests verify module interactions. E2E tests confirm critical user journeys. Breaking tests must be justified and documented. Test suite runs on every commit.

### III. Independent Feature Stories

User stories within a feature specification must be independently implementable and testable. Each story delivers discrete value and can be deployed separately. Story prioritization (P1, P2, P3) reflects delivery sequencing and user impact.

### IV. Code Quality & Observability

All code must be readable, maintainable, and debuggable. Structured logging is required for operational visibility. Code must follow language conventions and pass automated analysis. Complexity must be justified in code review.

### V. Versioning & Stability

Semantic Versioning (MAJOR.MINOR.PATCH) governs all releases. MAJOR version bumps indicate breaking changes and require migration documentation. MINOR bumps indicate backward-compatible feature additions. PATCH bumps are bug fixes and clarifications. Public APIs and data schemas are versioned explicitly.

### VI. Accessibility (WCAG 2.2 Level AA)

All code and user interfaces MUST conform to WCAG 2.2 Level AA standards. This includes keyboard navigation, screen reader support, color contrast (4.5:1 for normal text, 3:1 for large text), semantic HTML, proper ARIA usage, and skip links. Accessibility is not optional; features failing accessibility checks must be remediated before merge. Use testing tools (e.g., Accessibility Insights) and manual testing to verify. Go beyond minimal conformance to provide inclusive experiences.

### VII. Clean Code

Code is written for humans first, machines second. Follow clean code principles: meaningful names, single responsibility, small functions (< 20 lines), clear abstractions, DRY (Don't Repeat Yourself), and KISS (Keep It Simple, Stupid). Every class, function, and module has one clear purpose. Refactor continuously to eliminate technical debt. Code reviews reject complexity without compelling justification.

### VIII. Simple UX

User interfaces prioritize clarity and usability over novelty. Every screen serves one primary user goal. Remove unnecessary elements; every component must justify its presence. Use familiar patterns and clear visual hierarchy. Reduce cognitive load: fewer choices, obvious next steps, immediate feedback. User testing validates simplicity assumptions before release.

### IX. Responsive Design

All interfaces work flawlessly across devices and viewport sizes (mobile-first). Use fluid layouts, flexible grids, and responsive images. Breakpoints support mobile (320px+), tablet (768px+), and desktop (1024px+). Touch targets meet minimum sizes (44x44px). Test on real devices and screen readers. Performance matters: optimize for slow networks and lower-end devices.

### X. Minimal Dependencies

Every external dependency is a liability. Add dependencies only when building the solution in-house is significantly more costly. Audit dependencies quarterly for security, maintenance status, and necessity. Prefer smaller, focused libraries over monolithic frameworks (beyond core stack). Remove unused dependencies immediately. Document why each dependency exists.

## Development Workflow

- **Planning Phase**: Feature specification is created, reviewed, and approved with acceptance scenarios defined. Accessibility requirements are explicit.
- **Implementation Phase**: Tasks are generated from specification; developers implement following TDD; peer code review ensures constitution compliance and accessibility standards.
- **Testing Phase**: Unit, integration, and E2E tests validate acceptance scenarios and accessibility conformance; all tests pass before merge. Test coverage reports reviewed.
- **Documentation**: Feature documentation (quickstart, API contracts, data models) is maintained alongside code. JSDoc and comments capture intent.

## Technology Standards

**Mandatory Stack**:

- **Framework**: Next.js (App Router preferred for server components)
- **Language**: TypeScript 5.x (strict mode enabled) compiling to ES2022
- **Styling**: Tailwind CSS
- **Component Library**: MUI (Material UI) Base or Core for complex interactive elements (DatePickers, Modals); style with Tailwind or MUI's `sx` prop as needed or instructed
- **Design System**: Storybook (all atomic components must be documented)
- **Package Manager**: pnpm (no npm or yarn)
- **Module System**: Pure ES modules only (no CommonJS)
- **Database**: PostgreSQL via Prisma ORM
- **State Management**: React Query (TanStack Query) for server state; React Context for simple client state
- **API Specification**: OpenAPI (Swagger) 3.0 - all endpoints defined in `spec/openapi.yaml` before implementation
- **Payments**: Stripe (PaymentIntents API) via a modular payment provider interface so additional methods can be integrated later without core refactors
- **Validation**: Zod schemas at system boundaries (API inputs, form submissions)
- **Date Handling**: date-fns library
- **Calendar Files**: ics package for ICS generation

**Code Quality**:

- `any` type strictly forbidden; use `unknown` with narrowing.
- Use Zod schemas to validate runtime data at system boundaries.
- Use discriminated unions for state and events.
- Prefer immutable data and pure functions.
- Keep functions focused (< 20 lines); extract helpers early.
- Functions do one thing well; classes have single responsibility.
- Run repository lint and format scripts before commit.
- No dead code, commented-out code, or console.log statements in production.
- If a component is hard to mock in Storybook, it's too coupled—refactor.
- Public methods, services, hooks, and utilities MUST be documented with purpose, params, and return types.

**Type System**:

- Use PascalCase for classes, interfaces, enums, type aliases; camelCase for values.
- Avoid interface prefixes (e.g., no `I`); use descriptive names.
- Express intent with TypeScript utility types (`Readonly`, `Partial`, `Record`).

**Async & Error Handling**:

- Use `async/await`; guard edge cases early.
- Wrap awaits in try/catch with structured errors.
- Send errors through the project's logging utilities.
- Apply retries, backoff, and cancellation to network/IO calls.

**Architecture**:

- Follow dependency injection patterns; keep modules single-purpose.
- Decouple transport, domain, and presentation layers.
- Supply lifecycle hooks (`initialize`, `dispose`) and targeted tests for services.
- Instantiate clients outside hot paths; inject for testability.

**File Organization**:

- Use kebab-case filenames (e.g., `user-session.ts`, `data-service.ts`).
- Keep tests, types, and helpers near their implementation.
- Reuse and extend shared utilities before creating new ones.
- Follow Next.js App Router conventions for pages, layouts, and route handlers.

**Testing Requirements**:

- **Unit Tests**: Every function, component, hook using Jest or Vitest.
- **Integration Tests**: API routes, database interactions, third-party service integrations.
- **E2E Tests**: Critical user flows using Playwright.
- **Storybook**: Every UI component must have a Storybook story documented.
- Test files colocated with source: `component.tsx` → `component.test.tsx`.
- Minimum 90% code coverage for unit tests; 100% for critical paths.
- Do not introduce any form of test bloat, keep tests meaningful and focused.
- All tests must pass before merge; flaky tests are bugs.
- **TDD Workflow**: (1) Write failing test, (2) Write minimum code to pass, (3) Refactor.

**Responsive Design Requirements**:

- Mobile-first approach using Tailwind's responsive utilities (design for 375px width first).
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- Touch targets minimum 44px tall for accessibility.
- Test on real devices and Chrome DevTools device emulation.
- Images use Next.js Image component with responsive sizes.
- Typography scales appropriately across breakpoints.

**UI/UX Guidelines**:

- Use MUI DataGrid for admin dashboard scannability (filtering "Today's Bookings", "Pending Payments").
- Service listing and calendar components built in Storybook first.
- Stripe Elements integrated for payment collection.
- All interactive MUI components styled consistently with Tailwind or minimal `sx` prop usage.

**Dependency Management**:

- All packages installed via `pnpm add` (production) or `pnpm add -D` (dev).
- Lock file (`pnpm-lock.yaml`) committed to repository.
- Audit dependencies monthly: `pnpm audit`.
- Document justification for each major dependency in project README.
- Remove unused dependencies immediately.
- Do not install a library if native solution or simple helper suffices (exceptions: date-fns, Zod, stripe-js).

## Deployment & Hosting

- Deployment targets MUST include Vercel as the primary hosting option.
- Alternative low-cost hosting providers may be used when required; document rationale and trade-offs.
- Environment variables managed via hosting provider secrets; no secrets in code or repo.
- Production deployments must include database migrations and smoke checks.
- Use preview deployments for every pull request.

## API Design Principles

**RESTful Standards**:

- Follow standard HTTP verbs (GET, POST, PATCH, DELETE).
- All endpoints defined in `spec/openapi.yaml` before implementation (OpenAPI-First).
- API responses follow consistent JSON structure with proper error codes.

**Idempotency**:

- Payment and Booking Creation endpoints MUST be idempotent to prevent duplicate charges on network retries.
- Use idempotency keys for Stripe PaymentIntents.
- Database transactions ensure atomic booking creation (no race conditions).

**Validation**:

- All API inputs validated using Zod schemas before processing.
- Return structured error responses with field-level validation messages.

## Data Model & Domain Rules

**Single-Service Booking Model** (strict 1:1 relationship):

**Service Entity**:

- Fields: `id`, `name`, `description`, `durationMin`, `priceCents`, `downpaymentCents`
- Represents the product catalog (e.g., "Deep Tissue - 60min")

**Booking Entity**:

- Fields: `id`, `customerEmail`, `serviceId`, `startTime` (UTC), `endTime` (UTC), `status`, `stripePaymentIntentId`
- Status values: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`
- Transactional record with foreign key to Service

**Availability Computation**:

- Availability is NOT stored as open slots—calculated on-the-fly
- Formula: `BusinessHours - (ExistingBookings + BufferTime)` subject to daily booking cap
- **Buffer Rule**: 15-minute cleanup buffer enforced after every booking
- **Daily Cap Rule**: Admin-configurable maximum number of bookings per day; bookings beyond cap are blocked
- Zero double-bookings via atomic database transactions with row-level locking

**Schema Management**:

- Prisma migrations track all schema changes
- Migration files committed to repository
- Database constraints enforce referential integrity

**Admin Settings**:

- System settings include `maxBookingsPerDay` configurable by admin
- Changes to settings are audited and take effect immediately

## Security & Data

- Validate and sanitize all external input with schema validators or type guards.
- Never hardcode secrets; load from secure sources only.
- Avoid dynamic code execution and untrusted template rendering.
- Encode untrusted content before rendering HTML; use framework escaping or trusted types.
- Use parameterized queries or prepared statements to prevent injection.
- Keep secrets in secure storage; rotate regularly; request least-privilege scopes.
- Favor immutable flows and defensive copies for sensitive data.
- Use vetted crypto libraries only; patch dependencies promptly.

## Accessibility Standards

**WCAG 2.2 Level AA Compliance** (mandatory for all user-facing features):

**Keyboard Navigation**:

- All interactive elements keyboard navigable with predictable focus order (typically reading order).
- Focus always visible; static (non-interactive) elements not in tab order unless programmatically focused.
- Composite components (grids, menus, tabs) use roving tabindex or `aria-activedescendant`.
- Escape key closes open dialogs, menus, and dropdowns.
- Skip links provided for repeated content blocks (e.g., "Skip to main").

**Screen Reader Support**:

- All elements correctly convey semantics: name, role, value, state, properties.
- Use native HTML elements and ARIA attributes appropriately.
- Use landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`) and proper heading hierarchy.
- Only one `<h1>` per page; avoid skipping heading levels.
- Form labels must accurately describe purpose; required fields marked with `aria-required="true"`.

**Visual & Color**:

- Contrast: 4.5:1 for normal text, 3:1 for large text (18.5px bold or 24px+).
- Parts of graphics and controls conveying state/type must meet 3:1 contrast.
- Color must not be the only way to convey information; use text, shapes, or patterns too.
- Dark text on light or light on dark; avoid light-on-light or dark-on-dark.

**Images & Graphics**:

- All informative images have meaningful alternative text (`alt` attributes or `aria-label`).
- Decorative images marked with empty `alt=""` or `aria-hidden="true"`.
- Emojis and icon fonts treated as images with appropriate roles and alt text.

**Forms**:

- Error messages inline, linked to fields via `aria-describedby`.
- Submit buttons never disabled; validation triggered on attempt.
- On invalid input, focus moves to first invalid field via `element.focus()`.

**Cognitive Accessibility**:

- Prefer plain language; consistent page structure and navigation order.
- Keep interfaces clean and simple; reduce unnecessary distractions.

## Implementation Roadmap

Feature development follows a phased approach to manage complexity and ensure solid foundations:

**Phase 1: Foundation**

- Initialize Next.js with TypeScript, Tailwind, Storybook, and MUI
- Define `spec/openapi.yaml` API specification
- Set up Prisma with Service and Booking schema
- Configure PostgreSQL database

**Phase 2: Core Logic (TDD Focus)**

- Implement `AvailabilityService` (Backend): Calculate slots based on business hours and existing bookings
- Implement `BookingService` (Backend): Transactional logic to create bookings with row-level locking
- Unit and integration tests for all business logic

**Phase 3: Customer Frontend**

- Build Service Listing components in Storybook
- Build Calendar component with disabled date logic
- Integrate Stripe Elements for payment collection
- Implement booking form with Zod validation

**Phase 4: Admin Panel**

- Build Dashboard with authentication
- Implement MUI DataGrid for booking management
- Add "Mark as Paid" and "Cancel Booking" features
- Add "Max bookings per day" setting with validation and audit trail
- Admin-specific E2E tests

**Phase 5: Notifications & Webhooks**

- Implement Stripe webhooks for payment confirmation
- Create ICS generation logic using `ics` package
- Set up email templates with calendar attachments
- Test full payment and notification flow

## Governance

This constitution supersedes all other development practices. All pull requests must verify compliance with core principles. Violations discovered during review must be resolved before merge.

**Amendment Procedure**: Constitutional amendments require written justification, impact analysis on existing features, and approval consensus. Amendments increment the constitution version according to semantic versioning rules and are documented in this file's header.

**Compliance Review**: Random feature audits verify constitution compliance quarterly. Non-compliance findings are escalated and resolved before next release.

**Version**: 1.4.0 | **Ratified**: 2026-02-01 | **Last Amended**: 2026-02-02
