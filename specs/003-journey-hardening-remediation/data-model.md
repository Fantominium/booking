# Data Model: TruFlow Journey Hardening Remediation

This feature primarily reuses the existing persisted booking and admin domain. The data model work is focused on clarifying which entities are already present, which derived entities drive remediation, and where a narrowly scoped schema extension may be required.

## Existing Persisted Entities Reused

### Service

- **Purpose**: Current catalog entity for bookable offerings displayed under `src/app/book`.
- **Existing fields**: `id`, `name`, `description`, `durationMin`, `priceCents`, `downpaymentCents`, `isActive`.
- **Remediation relevance**: Session, event, and rental journeys should map here unless the discovery audit proves a small taxonomy extension is required.

### Booking

- **Purpose**: Existing persisted record for a customer reservation/booking.
- **Existing fields**: customer identity, time range, status, Stripe payment intent, paid/downpayment amounts, remaining balance.
- **Remediation relevance**: Needs to represent clearer end states for immediate payment vs bank-transfer pending flows.

### BusinessHours

- **Purpose**: Standard availability windows.
- **Remediation relevance**: Must continue to govern session/event/rental reachability and admin availability management.

### DateOverride

- **Purpose**: Holiday and temporary blocking rules.
- **Remediation relevance**: Explicitly part of the admin operational workflows and availability regression coverage.

### SystemSettings

- **Purpose**: Global booking settings.
- **Remediation relevance**: Candidate location for bank-transfer instructions or payment-choice configuration if existing configuration storage is needed.

### Admin

- **Purpose**: Authenticated admin identity.
- **Remediation relevance**: Authorization checks and dashboard reachability depend on this entity plus NextAuth session state.

## Derived Or Conceptual Entities

### BookingJourneyVariant

- **Purpose**: Describes the customer-facing journey type under remediation.
- **Fields**:
  - `id`: `"session" | "event" | "rental"`
  - `entryPoints`: `string[]`
  - `catalogMapping`: service ids, slugs, or filter logic discovered in audit
  - `completionRoutes`: ordered list of expected route/stage transitions
  - `currentStatus`: `"verified" | "partial" | "broken" | "not-yet-mapped"`
- **Persistence**: Derived from routes, fixtures, and service data; does not need a standalone table.

### JourneyEntryPointAudit

- **Purpose**: Captures the Phase 0 reachability inventory for public and admin routes.
- **Fields**:
  - `source`: page, CTA, bookmark, or direct URL
  - `targetRoute`: route/path reached
  - `surface`: `"public" | "admin"`
  - `expectedOutcome`: reachable, redirect, denial, or recovery path
  - `actualOutcome`: reachable, broken, dead-end, wrong-surface, or unauthorized-render
  - `severity`: `P1 | P2`
  - `notes`: remediation detail
- **Persistence**: Audit artifact only.

### PaymentChoicePresentation

- **Purpose**: The explicit final-step choice set shown before booking commitment.
- **Fields**:
  - `options`: immediate payment and bank transfer
  - `label`
  - `nextStepDescription`
  - `bookingOutcomeLabel`
  - `customerActionRequired`
  - `supportingInstructions`
- **Persistence**: View model and API response concern; may be partially configuration-backed.

### BookingOutcomeState

- **Purpose**: Normalized outcome semantics required by the feature.
- **Representative values**:
  - `confirmed_paid`
  - `reserved_pending_transfer`
  - `payment_pending_immediate`
  - `requires_correction`
  - `cancelled`
- **Persistence**: Prefer a narrow extension of existing booking status/payment metadata instead of a new aggregate entity.

### AdminRouteGuard

- **Purpose**: Logical model for authorization enforcement across page render and API access.
- **Fields**:
  - `routePattern`
  - `requiredRole`: `admin`
  - `entryMode`: direct URL, refresh, bookmark, in-app navigation, API call
  - `unauthorizedOutcome`: redirect or JSON 401/403
  - `renderProtection`: whether denial happens before protected content renders
- **Persistence**: Code-level policy, not database state.

### NavigationModalState

- **Purpose**: Accessibility-critical state model for the mobile navigation modal.
- **Fields**:
  - `isOpen`: boolean
  - `triggerElement`: element that regains focus on close
  - `focusTrapActive`: boolean
  - `dismissReason`: close button, backdrop, escape, navigation
  - `visualState`: opening, open, closing, closed
- **Persistence**: Client UI state only.

### BrandHeaderPresentation

- **Purpose**: The primary brand treatment in the header.
- **Fields**:
  - `logoAssetPath`
  - `titleText`
  - `layout`: logo-left, text-right
  - `fallbackBehavior` when logo asset fails
  - `contrastProfile`
- **Persistence**: UI configuration only.

### CoverageRequirement

- **Purpose**: Tracks required automated coverage by surface.
- **Fields**:
  - `surface`: public journey, payment choice, admin authz, modal nav, accessibility regression
  - `coverageType`: BDD, E2E, integration, contract, security, Storybook
  - `artifactLocation`
  - `passCondition`
- **Persistence**: Planning/testing artifact only.

## Candidate Minimal Schema Extensions

These are intentionally conditional and should only be introduced if the discovery audit proves they are necessary:

1. `Service.offeringType`
   - Enum candidate: `SESSION | EVENT | RENTAL`
   - Use only if current service catalog cannot identify the required journey variants without brittle naming conventions.

2. Booking payment-choice metadata
   - Candidate fields: `paymentMethod`, `paymentState`, `bankTransferReference`, or equivalent narrowly scoped representation.
   - Use only if the current `status` plus `remainingBalanceCents` cannot clearly distinguish reserved-pending-transfer vs fully paid outcomes.

3. System settings for transfer instructions
   - Candidate fields: bank account label, sort code/account metadata, transfer memo/reference instructions, payment due window.
   - Use only if the information is operationally managed rather than static documentation.

## State Transitions

### Customer Booking Flow

| Trigger                            | From                        | To                          | Notes                                                               |
| ---------------------------------- | --------------------------- | --------------------------- | ------------------------------------------------------------------- |
| Customer chooses valid entry point | `entry`                     | `offering-selected`         | Must work for session, event, and rental paths                      |
| Customer selects date/time         | `offering-selected`         | `slot-selected`             | Unavailable slot returns recovery path                              |
| Customer submits details           | `slot-selected`             | `details-captured`          | Recoverable validation must preserve input                          |
| Customer selects immediate payment | `details-captured`          | `payment_pending_immediate` | Existing Stripe path remains primary immediate-payment flow         |
| Card payment succeeds              | `payment_pending_immediate` | `confirmed_paid`            | Confirmation state is explicit                                      |
| Customer selects bank transfer     | `details-captured`          | `reserved_pending_transfer` | Must show bank instructions and pending state                       |
| Recoverable failure occurs         | any in-flow state           | `requires_correction`       | Customer can return to a valid state without restart when practical |

### Admin Authorization Flow

| Trigger                                | From                           | To           | Notes                                                     |
| -------------------------------------- | ------------------------------ | ------------ | --------------------------------------------------------- |
| Valid admin session on protected route | `unauthenticated-or-non-admin` | `authorized` | Protected screen may render                               |
| Non-admin direct access                | `unauthenticated-or-non-admin` | `denied`     | Deny before protected content displays                    |
| Session expires mid-task               | `authorized`                   | `denied`     | Require re-authentication before protected action resumes |

### Navigation Modal Flow

| Trigger                                       | From      | To        | Notes                                      |
| --------------------------------------------- | --------- | --------- | ------------------------------------------ |
| Hamburger activated                           | `closed`  | `opening` | Focus moves into modal                     |
| Transition completes                          | `opening` | `open`    | Focus trap active; X close control visible |
| Escape, backdrop, close button, or nav action | `open`    | `closing` | Dismissal reason recorded in UI state      |
| Transition completes                          | `closing` | `closed`  | Focus returns to trigger                   |

## Relationships

- `BookingJourneyVariant` maps to one or more `Service` records or service filters.
- `JourneyEntryPointAudit` evaluates each `BookingJourneyVariant`, admin route, and navigation entry point.
- `PaymentChoicePresentation` determines the resulting `BookingOutcomeState` for a `Booking`.
- `AdminRouteGuard` protects admin pages and admin route handlers that operate on `Service`, `Booking`, `BusinessHours`, `DateOverride`, and `Admin`.
- `CoverageRequirement` applies across journey, payment, admin, navigation, and branding surfaces.
