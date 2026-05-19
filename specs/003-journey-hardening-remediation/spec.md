# Feature Specification: TruFlow Journey Hardening Remediation

**Feature Branch**: `003-journey-hardening-remediation`  
**Created**: 2026-03-20  
**Status**: Draft  
**Input**: User description: "Create or update a new feature specification in /Users/malcolm/Desktop/projects/speckit/bookings/specs for a new feature that consolidates the following issues into a spec-driven remediation track for the TruFlow booking app. Use the next sequential feature id after 002. The feature should focus on application journey completion, admin security hardening, navigation/accessibility remediation, and branding corrections. Reuse and align with existing specs 001-truflow-booking, 001-unified-navigation, and 002-platform-overhaul without duplicating them unnecessarily."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Customer Completes Any Booking Journey (Priority: P1)

As a customer, I want every customer-facing booking path to be reachable and complete so that I can successfully reserve and book a session, event, or rental without hitting dead ends.

**Why this priority**: This is the core business journey. If customer links or booking flows are incomplete, the product fails at its primary purpose.

**Independent Test**: From the public landing and navigation entry points, a tester can start a session, event, and rental journey, reach the final payment-choice step, select a payment option, and receive a clear booking outcome.

**Acceptance Scenarios**:

1. **Given** a customer starts from any public booking entry point, **When** they choose a bookable service category, **Then** they can proceed through the full journey without encountering a missing route, blocked screen, or dead-end action.
2. **Given** a customer selects a session, **When** they complete the booking flow, **Then** the system records the reservation and presents a clear confirmation state.
3. **Given** a customer selects an event, **When** they complete the booking flow, **Then** the system records the reservation and presents a clear confirmation state.
4. **Given** a customer selects a rental, **When** they complete the booking flow, **Then** the system records the reservation and presents a clear confirmation state.
5. **Given** a customer reaches the final step of a booking journey, **When** payment choices are shown, **Then** the customer sees all supported payment options, including explicit bank transfer details as one available option.

---

### User Story 2 - Customer Chooses How To Pay (Priority: P1)

As a customer, I want the end of the flow to present payment choices clearly, including bank transfer information, so that I can complete or reserve my booking using a method I understand and can act on immediately.

**Why this priority**: Payment-choice clarity is a prerequisite for conversion, support reduction, and trust at the point of commitment.

**Independent Test**: A tester can complete the same booking journey with an immediate-payment option and with bank transfer, and in both cases the system communicates next steps, payment state, and booking state clearly.

**Acceptance Scenarios**:

1. **Given** a customer is on the final checkout step, **When** payment choices are presented, **Then** each option includes its label, what happens next, and any action the customer must take.
2. **Given** a customer selects bank transfer, **When** they confirm the booking, **Then** the system shows the bank information required to complete payment and explains the booking's pending or reserved payment state.
3. **Given** a customer selects an immediate payment option, **When** they complete payment successfully, **Then** the booking confirmation reflects that payment has been completed.

---

### User Story 3 - Admin Reaches And Operates The Secure Dashboard (Priority: P1)

As an authenticated admin, I want the admin dashboard and key management flows to be reachable and operational so that I can run the business without broken screens or access gaps.

**Why this priority**: Business operations depend on admins being able to manage offerings, availability, and booking constraints reliably.

**Independent Test**: An authenticated admin can reach the dashboard and complete core workflows for products or services, working hours, holiday blocks, emergency blocks, and booking-related administration.

**Acceptance Scenarios**:

1. **Given** a valid admin user is authenticated, **When** they navigate to the admin area, **Then** the dashboard loads successfully and exposes the expected operational entry points.
2. **Given** an authenticated admin is managing offerings, **When** they create, update, or retire a product or service, **Then** the change is saved and reflected in the relevant customer journey.
3. **Given** an authenticated admin is managing availability, **When** they update working hours or add a holiday or emergency block, **Then** future customer availability reflects those constraints.
4. **Given** an authenticated admin is on any key admin route, **When** they move between dashboard and operational screens, **Then** each route is reachable and completes its primary action successfully.

---

### User Story 4 - Non-Admins Are Excluded From Admin Surfaces (Priority: P1)

As a non-admin user, I must not see or access admin-only pages so that privileged tools and data remain protected.

**Why this priority**: Role-based protection is a non-negotiable security requirement and a direct user request.

**Independent Test**: A non-admin or unauthenticated user cannot discover admin actions in public navigation and cannot load admin routes through direct URL access.

**Acceptance Scenarios**:

1. **Given** a non-admin user is on a public page, **When** they inspect visible navigation and page actions, **Then** admin-only links, controls, and routes are not shown.
2. **Given** a non-admin user enters an admin URL directly, **When** access is evaluated, **Then** the system denies access before any admin-only content is displayed.
3. **Given** an admin session expires or becomes invalid, **When** the user attempts to load an admin page, **Then** the system re-evaluates authorization and prevents further access until valid admin authentication is restored.

---

### User Story 5 - Navigation, Accessibility, And Branding Are Corrected (Priority: P2)

As a customer or admin, I want navigation, typography, contrast, and branding to be accessible and consistent so that the app is readable, predictable, and recognizably TruFlow.

**Why this priority**: These issues directly affect usability, trust, and compliance, especially for low-vision users and mobile navigation.

**Independent Test**: A tester can open the app on mobile and desktop, use the hamburger menu as a modal, verify the close control uses a standard accessible X, confirm focus and transitions behave correctly, and verify the TruFlow logo appears to the left of the title copy instead of the hexagonal icon.

**Acceptance Scenarios**:

1. **Given** a mobile user opens the primary menu, **When** the hamburger control is activated, **Then** a modal navigation experience opens, focus moves into it, and the menu is not implemented as a hidden in-page section.
2. **Given** the navigation modal is open, **When** the close control is shown, **Then** it uses a standard accessible X icon and a complete visible transition between open and closed states.
3. **Given** a low-vision user views the app, **When** they read navigation, headings, and body text, **Then** contrast and typography remain readable and meet WCAG 2.2 AA expectations.
4. **Given** the application header is rendered, **When** branding is shown, **Then** the approved TruFlow logo appears to the left of the TruFlow title copy and the prior hexagonal icon is no longer used as the primary brand mark.

### Required Test Coverage

- BDD scenarios MUST cover the complete customer booking journeys for session, event, and rental flows, including payment-choice presentation and bank transfer handling.
- End-to-end tests MUST cover public booking completion, authenticated admin dashboard reachability, admin workflow completion, and unauthorized access denial for admin-only pages.
- Integration tests MUST cover role-based protection, booking state transitions, availability blocking behavior, and payment-choice state handling.
- Regression coverage MUST explicitly protect previously delivered booking, navigation, and overhaul foundation behaviors referenced by the aligned specs.

### Edge Cases

- A customer follows an older or secondary public link that previously led into a partial flow: the system must route them into a supported journey or provide a clear recovery path instead of a dead end.
- A selected session, event, or rental becomes unavailable before confirmation: the customer must be told the item is no longer available and be returned to a valid selection state.
- A customer selects bank transfer but does not complete the transfer in the expected timeframe: the booking must remain in a clearly communicated pending or reserved state and must not be mistaken for fully paid.
- A non-admin user loads an admin route from a bookmark, shared link, or stale browser state: admin content must remain hidden until authorization succeeds.
- An authenticated admin loses session validity mid-task: the system must prevent further protected actions and preserve enough context for safe recovery after re-authentication.
- The navigation modal is opened by keyboard or assistive technology: focus order, escape behavior, and dismissal must remain operable and predictable.
- The logo asset fails to load: the TruFlow title must remain visible and usable without breaking navigation or obscuring brand identity.
- Accessibility remediations improve contrast on one route but regress on another: regression checks must catch inconsistent theme or typography behavior before release.

## Requirements _(mandatory)_

### Functional Requirements

#### Alignment And Scope Boundaries

- **FR-001**: This feature specification MUST act as a remediation track that closes end-to-end journey, security, accessibility, and branding gaps left open across existing delivered or planned work.
- **FR-002**: This feature MUST align with [001-truflow-booking](../001-truflow-booking/spec.md), [001-unified-navigation](../001-unified-navigation/spec.md), and [002-platform-overhaul](../002-platform-overhaul/spec.md) by reusing their established intent and extending only the unresolved remediation scope.
- **FR-003**: This feature MUST NOT redefine the full product vision, general navigation strategy, or platform-governance foundation already established in the aligned specs unless a remediation requirement explicitly supersedes an incomplete or conflicting behavior.

#### Customer Journey Completion

- **FR-004**: All customer-facing links and entry points related to browsing, reserving, and booking MUST lead to reachable, functionally complete journeys.
- **FR-005**: The system MUST allow a customer to reserve and book a session end to end.
- **FR-006**: The system MUST allow a customer to reserve and book an event end to end.
- **FR-007**: The system MUST allow a customer to reserve and book a rental end to end.
- **FR-008**: Every supported booking journey MUST end in a clear outcome state that tells the customer whether the booking is confirmed, reserved pending payment, or requires corrective action.
- **FR-009**: The system MUST preserve the customer's progress and entered information where practical when recoverable validation or flow errors occur.

#### Payment Choice Presentation

- **FR-010**: The final step of each booking journey MUST present available payment options clearly before the customer commits.
- **FR-011**: Bank transfer MUST be presented as an explicit available option, including the bank information the customer needs to act on it.
- **FR-012**: The system MUST distinguish between a booking that is fully paid and a booking that is reserved or pending because bank transfer has not yet been confirmed.
- **FR-013**: Payment-choice presentation MUST explain the next steps, expected booking state, and any follow-up actions for each option.

#### Admin Reachability And Operational Flows

- **FR-014**: The admin dashboard MUST be reachable for authenticated admins.
- **FR-015**: Authenticated admins MUST be able to manage products and services through operationally complete create, update, and retire flows.
- **FR-016**: Authenticated admins MUST be able to manage working hours through operationally complete create, update, and review flows.
- **FR-017**: Authenticated admins MUST be able to create, update, and remove holiday blocking rules.
- **FR-018**: Authenticated admins MUST be able to create, update, and remove emergency blocking rules.
- **FR-019**: Key admin journeys MUST be operational end to end, including reaching the target screen, completing the intended action, receiving a success or failure outcome, and seeing the updated state reflected in subsequent views.

#### Role-Based Protection And Security Hardening

- **FR-020**: Every admin-only page and admin-only action MUST be protected by role-based authorization checks.
- **FR-021**: Admin-only pages and actions MUST NOT be visible in customer-facing navigation or public-facing content.
- **FR-022**: Unauthorized and non-admin users MUST be denied access to admin-only routes before protected content is rendered.
- **FR-023**: Authorization checks MUST be applied consistently to direct URL access, refreshed pages, bookmarked pages, and in-app navigation.
- **FR-024**: When an admin session is absent, expired, or downgraded, the system MUST block protected actions and require valid admin authentication before access resumes.

#### Navigation And Accessibility Remediation

- **FR-025**: The hamburger menu MUST open as a modal navigation experience rather than as a hidden section embedded in the page layout.
- **FR-026**: The navigation modal MUST provide keyboard access, focus management, visible focus indication, and predictable dismissal behavior consistent with WCAG 2.2 AA.
- **FR-027**: The hamburger close control MUST use a standard accessible X icon.
- **FR-028**: The transition between hamburger and close states MUST be visually complete, understandable, and free of ambiguous intermediate states.
- **FR-029**: The overall theme MUST support low-vision users through sufficient contrast, readable typography, and legible interactive states across customer and admin surfaces.
- **FR-030**: Navigation, controls, headings, body text, and status messaging across the remediated journeys MUST meet WCAG 2.2 AA requirements.
- **FR-031**: Accessible navigation behavior MUST remain consistent across mobile and desktop breakpoints.

#### Branding Corrections

- **FR-032**: The approved TruFlow logo asset MUST be displayed to the left of the TruFlow title copy in the primary brand presentation.
- **FR-033**: The existing hexagonal icon MUST NOT remain as the primary brand mark in the header or equivalent primary navigation surfaces.
- **FR-034**: Branding updates MUST preserve navigational clarity and remain readable under the same accessibility requirements as the rest of the header.

#### Quality And Regression Protection

- **FR-035**: BDD coverage MUST describe the intended behavior for customer journey completion, payment-choice presentation, admin access protection, and accessibility-critical navigation behavior.
- **FR-036**: End-to-end coverage MUST exercise session, event, and rental booking completion, admin dashboard reachability, admin management actions, and unauthorized access rejection.
- **FR-037**: Integration coverage MUST verify booking-state handling, payment-choice outcomes, availability blocking, navigation modal behavior, and authorization enforcement.
- **FR-038**: Regression coverage MUST protect the behaviors inherited from the aligned specs where this feature depends on them.
- **FR-039**: Release validation for this feature MUST include evidence that the remediated customer and admin journeys remain complete after changes to branding, navigation, or access control.

### Key Entities _(include if feature involves data)_

- **Bookable Offering**: A customer-selectable commercial item that can be reserved or booked, including sessions, events, and rentals.
- **Booking Journey**: The end-to-end customer path from entry point through selection, details, payment choice, and final booking outcome.
- **Payment Choice**: The set of payment methods presented at the end of the booking journey, including immediate payment options and bank transfer with its associated instructions and status implications.
- **Admin Session**: The authenticated and authorized state required to reach and operate protected admin surfaces.
- **Availability Rule**: An admin-managed rule that controls when offerings can be booked, including standard working hours and temporary holiday or emergency blocks.
- **Navigation Modal**: The primary mobile navigation surface opened from the hamburger control and governed by modal accessibility behavior.
- **Brand Asset**: The approved TruFlow logo and title treatment used as the primary visual identifier in the application header.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of audited customer booking entry points for sessions, events, and rentals reach a complete end-to-end journey with no unresolved dead-end pages or broken actions.
- **SC-002**: 100% of audited booking journeys present payment choices at the end of the flow, including explicit bank transfer information.
- **SC-003**: 100% of audited admin-only routes deny access to non-admin and unauthenticated users before protected content is displayed.
- **SC-004**: 100% of targeted admin operational journeys for offerings, working hours, holiday blocks, and emergency blocks can be completed successfully by authenticated admins during acceptance testing.
- **SC-005**: Accessibility review of the remediated navigation, header, and booking/admin journeys shows no outstanding WCAG 2.2 AA violations related to contrast, typography, keyboard access, focus handling, or modal behavior.
- **SC-006**: Regression, integration, BDD, and end-to-end test suites contain explicit coverage for the remediated flows and pass for release readiness.

## Assumptions & Dependencies

- The booking domain defined in [001-truflow-booking](../001-truflow-booking/spec.md) remains the product baseline; this feature closes missing or incomplete journey behavior rather than redefining the booking model.
- The navigation model defined in [001-unified-navigation](../001-unified-navigation/spec.md) remains the navigation baseline; this feature corrects accessibility, modal behavior, branding, and authorization gaps within that direction.
- The quality and governance expectations defined in [002-platform-overhaul](../002-platform-overhaul/spec.md) remain in force; this feature adds remediation-specific coverage requirements rather than replacing those controls.
- At least one immediate payment option already exists or is planned outside this remediation track; this feature requires clear presentation of that option alongside bank transfer rather than redefining the full payment platform.
- The approved TruFlow logo asset is available for use in the header and related navigation surfaces.

## Definition of Done _(mandatory)_

All items below MUST be satisfied for completion:

- Public customer links for session, event, and rental journeys are reachable and complete end to end.
- Payment choice presentation includes bank transfer details and communicates booking state clearly for each option.
- Authenticated admins can reach the dashboard and complete products or services, working-hours, holiday-block, and emergency-block workflows.
- Non-admin and unauthenticated users cannot see or access admin-only pages or actions.
- The hamburger menu functions as an accessible modal with a standard X close control and complete transitions.
- Header branding uses the approved TruFlow logo to the left of the TruFlow title copy and no longer relies on the hexagonal icon as the primary brand mark.
- WCAG 2.2 AA validation is complete for the remediated customer and admin journeys, with explicit review of low-vision contrast and typography.
- BDD, integration, end-to-end, and regression coverage for the remediated flows is implemented and passing.
- Documentation and relevant specs are updated to reflect the remediated journey behavior, authorization rules, accessibility expectations, and branding decisions.
