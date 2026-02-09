# Feature Specification: TruFlow Booking Platform

**Feature Branch**: `001-truflow-booking`  
**Created**: 2026-02-02  
**Status**: Draft  
**Input**: User description: "Build an aesthetically calming website experience for TruFlow massage therapy booking platform with real-time availability, secure payments, and automated calendar integration"

## Clarifications

### Session 2026-02-03

- Q: Admin Authentication & Access Control → A: Multi-admin single role support with email/password authentication, password reset via email, and admin panel interface to add/remove admin users. All admins have identical permissions (no role differentiation in MVP).
- Q: Email Service Requirements → A: Async queue with automatic retry logic (exponential backoff: 1 min, 5 min, 15 min). Booking confirmed immediately; email queued in background. Admin dashboard displays email delivery status (Success/Failed/Retrying).
- Q: Data Retention & Customer Deletion → A: Immediate anonymization of PII upon verified deletion request with audit logging. System creates timestamped audit log entry (customer email, deletion timestamp, reason). Audit logs retained for 7 years. 24-hour SLA for deletion fulfillment.
**Concurrent Booking Conflict Resolution** → A: Database row-level locking with real-time availability check at payment confirmation. No pessimistic slot reservation during checkout. Slot availability verified atomically during final booking INSERT. If conflict detected (slot taken), payment is already charged; system initiates automatic refund and displays error with recovery options. **SLA**: Payment confirmation (Stripe confirmation) MUST complete within 60 seconds of the availability check. If customer is still on checkout form after 60 seconds, system displays warning "Slot availability may have changed; please refresh your calendar to confirm selected time is still available" before final payment submission.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer Books Massage Appointment (Priority: P1)

A customer visits TruFlow's website, browses available massage services, selects a preferred date and time, provides their contact details, pays the down-payment, and receives instant confirmation with a calendar file.

**Why this priority**: This is the core revenue-generating flow. Without this working end-to-end, the business cannot accept bookings or collect payments. It represents the minimum viable product.

**Independent Test**: Can be fully tested by navigating through the booking flow from service selection to payment confirmation. Delivers complete value: a confirmed, paid booking with calendar integration.

**Acceptance Scenarios**:

1. **Given** the customer is on the TruFlow homepage, **When** they view the services page, **Then** they see all available massage services with names, prices, durations, and descriptions displayed in a calming, mobile-responsive layout.

2. **Given** the customer selects "Deep Tissue Massage (60 min)", **When** they proceed to scheduling, **Then** they see a calendar showing only dates with available time slots, with unavailable dates grayed out.

3. **Given** the customer selects an available date (e.g., Feb 10, 2026), **When** the date is clicked, **Then** they see specific available time slots (e.g., "10:00 AM", "2:30 PM") calculated based on service duration, existing bookings, and 15-minute buffer time.

4. **Given** the customer selects a time slot (e.g., "10:00 AM"), **When** they proceed to checkout, **Then** they see a guest form requesting Name, Email, and Phone (no password required).

5. **Given** the customer enters valid contact details, **When** they proceed to payment, **Then** they see the down-payment amount clearly displayed with a Stripe Elements payment form.

6. **Given** the customer enters valid payment details and submits, **When** the payment is processed successfully, **Then** they are redirected to a success page showing appointment details and remaining balance due in-person.

6b. **Given** the customer enters an invalid email (e.g., "notanemail"), **When** they attempt to proceed to payment, **Then** the form displays validation error "Please enter a valid email address" and the payment button remains disabled.

7. **Given** payment succeeded, **When** the success page loads, **Then** the customer receives an automated email containing booking details and an attached .ics calendar file compatible with Google Calendar, Outlook, and Apple Calendar.

8. **Given** the booking is confirmed, **When** the admin views the dashboard, **Then** the new booking appears in "Today's Schedule" (if booked for today) or the booking list with status "CONFIRMED".

---

### User Story 2 - Admin Manages Business Availability (Priority: P2)

The business owner logs into the admin panel to set standard operating hours (e.g., Mon-Fri 9 AM - 6 PM) and blocks out specific dates for holidays or personal time off.

**Why this priority**: Without availability management, the system cannot accurately calculate open slots. This is foundational for the booking engine but can be initially seeded with default values, making customer booking (P1) possible first.

**Independent Test**: Can be tested by logging into admin panel, configuring business hours, saving changes, and verifying that customer-facing calendar reflects these constraints. Delivers value: accurate availability representation.

**Acceptance Scenarios**:

1. **Given** the admin is logged into the TruFlow admin panel, **When** they navigate to "Availability Management", **Then** they see current operating hours displayed by day of week.

2. **Given** the admin is viewing operating hours, **When** they update Monday's hours from "9 AM - 5 PM" to "10 AM - 6 PM" and save, **Then** the system confirms the change and customer-facing availability reflects the new hours immediately.

3. **Given** the admin wants to block December 25, 2026 for Christmas, **When** they add a date override with reason "Christmas Holiday", **Then** that date becomes unavailable on the customer booking calendar.

4. **Given** the admin has set a max of 8 bookings per day, **When** the 8th booking is made for a specific date, **Then** that date becomes unavailable even if time slots theoretically exist within business hours.

5. **Given** business hours are configured, **When** a customer views the booking calendar, **Then** only dates and times within configured hours (minus existing bookings and buffers) appear as available.

---

### User Story 3 - Admin Manages Bookings and Payments (Priority: P3)

The business owner views all bookings in a filterable list or calendar view, marks remaining balances as paid when customers pay in-person, and cancels bookings when necessary.

**Why this priority**: This enables day-to-day operations management but isn't required for the initial booking flow to work. Can be implemented after core booking and availability management are stable.

**Independent Test**: Can be tested by creating test bookings, then using admin panel to view, filter, update payment status, and cancel. Delivers value: operational control and financial tracking.

**Acceptance Scenarios**:

1. **Given** the admin is logged in, **When** they navigate to "Booking Management", **Then** they see a list/calendar view of all bookings with filters for status (Pending, Confirmed, Completed, Cancelled).

2. **Given** the admin is viewing bookings, **When** they filter by "Confirmed" status, **Then** only confirmed bookings appear in the list.

3. **Given** a customer has paid their down-payment online and paid the remaining balance in-person, **When** the admin clicks "Mark Balance as Paid" on that booking, **Then** the booking status updates to "COMPLETED" and the financial record reflects full payment.

4. **Given** a customer calls to cancel their appointment, **When** the admin clicks "Cancel Booking" and confirms, **Then** the booking status changes to "CANCELLED", the time slot becomes available again, and the customer receives a cancellation email (future enhancement: refund logic).

5. **Given** the admin views the dashboard, **When** they look at "Pending Actions", **Then** they see bookings with unpaid balances highlighted for follow-up.

---

### User Story 4 - Admin Configures Services (Priority: P3)

The business owner adds new massage services, updates pricing or down-payment amounts, edits service descriptions, and removes discontinued services.

**Why this priority**: Service configuration is essential but can start with seed data. The admin doesn't need to modify services immediately for customers to book. This can follow operational management features.

**Independent Test**: Can be tested by creating, editing, and deleting services via admin panel, then verifying changes appear correctly on customer-facing pages. Delivers value: business flexibility and pricing control.

**Acceptance Scenarios**:

1. **Given** the admin is logged in, **When** they navigate to "Service Configuration", **Then** they see a list of all services with names, prices, durations, and down-payment amounts.

2. **Given** the admin wants to add a new service, **When** they click "Add Service" and enter details (Name: "Hot Stone Massage", Duration: 75 minutes, Price: $120, Down-payment: $30, Description: "Relaxing heated stone therapy"), **Then** the service is created and immediately available for customer booking.

3. **Given** the admin wants to update pricing, **When** they edit "Swedish Massage" to increase price from $80 to $90, **Then** the new price displays on the customer-facing service catalog immediately.

4. **Given** a service is discontinued, **When** the admin deletes "Aromatherapy Session", **Then** it no longer appears on the customer booking page but existing bookings for that service remain intact in the system.

5. **Given** the admin updates a service's down-payment from $25 to $35, **When** a customer books that service, **Then** they are charged the new $35 down-payment amount.

---

### Edge Cases

- **What happens when a customer's payment fails?** The booking is not created, the time slot remains available, and the customer sees an error message prompting them to retry or use a different payment method.

- **What happens when two customers try to book the same slot simultaneously?** System uses atomic database transaction with row-level locking at booking INSERT. Payment is processed first (charged to Stripe). At booking creation, system performs atomic availability check. First INSERT succeeds and claims slot. Second INSERT fails (slot no longer available), transaction rolls back, but payment already charged. System immediately initiates refund via Stripe refund API. Second customer receives error page with explanation and refund confirmation within 5 minutes. Customer can retry with different time slot.

- **What happens when a date has reached maximum bookings per day?** That date becomes unavailable on the calendar even if specific time slots theoretically exist within business hours.

- **What happens when business hours change retroactively (e.g., closing an hour earlier)?** Existing bookings outside new hours are flagged for admin review but not automatically cancelled to avoid customer disruption.

- **What happens if email delivery fails?** The booking is confirmed and stored; the system queues the email for automatic retry with exponential backoff (1 min, 5 min, 15 min). Admin dashboard shows email status as "Retrying" or "Failed" after all retries exhausted. Admin can manually trigger resend from booking details page. A warning icon appears in "Pending Actions" if email delivery fails completely.

- **What happens when a customer doesn't provide a valid phone number?** Phone field validation accepts common international formats. Invalid formats are rejected client-side before payment attempt.

- **What happens when admin tries to delete a service with existing future bookings?** System prevents deletion and displays error: "Cannot delete service with upcoming bookings. Cancel bookings first or mark service as inactive."

- **What happens during Stripe webhook delays?** Booking is created with "PENDING" status upon payment intent creation. Webhook updates status to "CONFIRMED" when payment succeeds. Admin can manually confirm if webhook is delayed beyond threshold (e.g., 5 minutes).

- **What happens when a customer books outside buffer time compliance?** This shouldn't occur because availability engine excludes slots that would violate buffer rules. If data corruption allows it, system logs error and notifies admin.

- **What happens when maximum daily bookings is reduced below current bookings for a day?** Existing bookings are honored; the cap only applies to new booking attempts. Admin sees a warning when changing the setting.

- **What happens to customer data if they request deletion?** System permanently deletes customer PII (name, email, phone) from booking records while preserving anonymized transaction records for accounting purposes (e.g., "Booking #1234, $80 collected").

## Requirements *(mandatory)*

### Functional Requirements

**Customer Booking Flow:**

- **FR-001**: System MUST display all active services with name, full price, duration in minutes, and description on a mobile-responsive catalog page.
- **FR-002**: System MUST calculate and display available dates based on service duration, business hours, existing bookings, 15-minute buffer time, and daily booking cap.
- **FR-003**: System MUST display available time slots for a selected date, formatted in 12-hour time (e.g., "10:00 AM").
- **FR-004**: System MUST prevent double-bookings using atomic database transactions with row-level locking. Slot availability is NOT reserved during checkout. At payment confirmation (booking INSERT), system performs atomic query: check if slot is still available, then INSERT booking in single transaction. If slot is taken by another booking, INSERT fails, transaction rolls back. Database ensures serializable isolation preventing concurrent bookings of same slot.
- **FR-005**: System MUST collect customer name, email, and phone number via a guest checkout form without requiring password creation.
- **FR-006**: System MUST validate email format and phone number format client-side before payment attempt.
- **FR-007**: System MUST process down-payments via Stripe PaymentIntents API with idempotent request handling (idempotency keys to ensure no duplicate charges on webhook retry).
- **FR-007b**: System MUST handle booking conflicts gracefully: if a booking creation fails due to concurrent slot booking, system MUST initiate automatic refund via Stripe refund API within 5 minutes. Customer receives refund notification email with clear explanation and option to retry booking. Refund appears in customer's bank account within 3–5 business days.
- **FR-008**: System MUST create booking record with status "PENDING" upon payment intent creation and update to "CONFIRMED" upon successful payment.
- **FR-009**: System MUST display success page showing appointment details (date, time, service, location if applicable) and remaining balance due in-person.
- **FR-010**: System MUST generate .ics calendar file compatible with Google Calendar, Outlook, and Apple Calendar containing booking details.
- **FR-011**: System MUST queue booking confirmation emails asynchronously with automatic retry logic (exponential backoff: 1 min, 5 min, 15 min). Email MUST include booking details and attached .ics file. Booking status marked "CONFIRMED" immediately upon successful payment; email delivery status tracked separately. Admin dashboard displays email delivery status (Success/Failed/Retrying) for each booking.

**Payment Security & Data Privacy:**

- **FR-038**: System MUST NEVER store raw payment card data (card numbers, CVV, expiration dates) on application servers or database.
- **FR-039**: System MUST use Stripe Elements for client-side payment form rendering to ensure card data never touches application server.
- **FR-040**: System MUST transmit all payment data directly from customer browser to Stripe using Stripe.js client-side integration.
- **FR-041**: System MUST verify Stripe webhook signatures using webhook signing secret before processing any webhook events.
- **FR-042**: System MUST serve all pages over HTTPS with TLS 1.2 or higher; HTTP requests MUST redirect to HTTPS.
- **FR-042b**: System MUST serve Strict-Transport-Security (HSTS) header on all HTTPS responses with `max-age=31536000; includeSubDomains` to enforce HTTPS for one year and all subdomains.
- **FR-043**: System MUST implement rate limiting on payment endpoints (max 5 payment attempts per IP per 15 minutes) to prevent brute force attacks.
- **FR-044**: System MUST log all payment operations (payment intent creation, confirmation, failures, refunds) with timestamp, booking ID, amount, and outcome (no card details).
- **FR-045**: System MUST sanitize all error messages shown to customers to prevent exposure of system internals, API keys, or sensitive configuration.
- **FR-046**: System MUST store only Stripe payment intent IDs and customer IDs (tokens) in database, never raw payment method details.
- **FR-047**: System MUST require HTTPS-only cookies with Secure, HttpOnly, and SameSite=Strict flags for admin session management.
- **FR-048**: System MUST implement Content Security Policy (CSP) headers allowing only necessary script sources (including Stripe.js from js.stripe.com).
- **FR-049**: System MUST maintain PCI-DSS SAQ-A compliance by never handling, processing, or storing cardholder data (verified through annual self-assessment).
- **FR-050**: System MUST encrypt database connections using SSL/TLS and store database credentials only in environment variables (never in code).
- **FR-051**: System MUST implement automatic data retention policy: delete customer PII from completed/cancelled bookings older than 2 years (configurable), preserving only anonymized financial records.
- **FR-052**: System MUST implement customer deletion mechanism: customer submits verified deletion request via email form. System immediately anonymizes customer PII in all associated booking records within 1 hour of verified request. **Fields to anonymize**: `customerName → "[DELETED]"`, `customerEmail → "[DELETED]"`, `customerPhone → "[DELETED]"`. **Fields to preserve** (financial records): `id`, `serviceId`, `startTime`, `endTime`, `status`, `downpaymentCents`, `remainingBalance`, `createdAt`, `stripePaymentIntentId` (token reference only). System creates audit log entry with original email hash, deletion timestamp, and request reason. Deletion request fulfillment SLA: 24 hours. Audit logs retained for 7 years.
- **FR-053**: System MUST implement webhook endpoint authentication requiring exact webhook URL path with unguessable token (e.g., `/api/webhooks/stripe/{SECRET_TOKEN}`).
- **FR-054**: System MUST validate all webhook event types and amounts against expected values before updating booking status.

**Availability Management:**

- **FR-012**: System MUST allow admin to configure business hours by day of week (e.g., Monday 9 AM - 5 PM, Sunday closed).
- **FR-013**: System MUST allow admin to create date-specific overrides (blocks) with a reason field.
- **FR-014**: System MUST allow admin to set a maximum number of bookings per day.
- **FR-015**: System MUST immediately reflect availability changes in customer-facing calendar without requiring system restart.
- **FR-016**: System MUST calculate available slots using formula: BusinessHours - (ExistingBookings + 15-minute buffer per booking) - subject to daily booking cap.

**Admin Booking Management:**

- **FR-017**: System MUST display all bookings in a filterable list with columns: Customer Name, Service, Date/Time, Status, Payment Status.
- **FR-018**: System MUST support filtering bookings by status (Pending, Confirmed, Completed, Cancelled).
- **FR-018a**: System MUST provide a debounced search input (300–500ms) to find bookings by customer name or phone number.
- **FR-019**: System MUST allow admin to mark remaining balance as paid, updating booking status to "COMPLETED".
- **FR-020**: System MUST allow admin to cancel bookings, changing status to "CANCELLED" and freeing the time slot.
- **FR-021**: System MUST display "Today's Schedule" on admin dashboard showing all bookings for current date.
- **FR-022**: System MUST display "Pending Actions" on dashboard showing bookings with unpaid balances or pending payment confirmations.

**Service Configuration:**

- **FR-023**: System MUST allow admin to create new services with fields: Name, Description, Duration (minutes), Price (cents), Down-payment (cents).
- **FR-024**: System MUST allow admin to update existing service details except when it would affect existing future bookings (notify admin of impact).
- **FR-025**: System MUST prevent deletion of services with existing future bookings.
- **FR-026**: System MUST immediately reflect service changes on customer-facing catalog.
- **FR-026a**: System MUST store prices in cents in backend records and display prices in dollars and cents on customer-facing pages.

**Payment & Financial:**

- **FR-027**: System MUST support "Split Payment" model: collect down-payment online, track remaining balance for in-person collection.
- **FR-028**: System MUST use modular payment provider interface to support future payment method additions without core refactors.
- **FR-029**: System MUST handle Stripe webhook events for payment confirmation with retry logic for failures.

**Design & UX:**

- **FR-030**: System MUST use a calming color palette and spacing to create an aesthetically calming experience using relaxing blue, gold, and green pastels (specific shades defined in design phase).
- **FR-031**: System MUST support both light and dark modes with appropriate text/background contrast while maintaining the calming palette.
- **FR-032**: Customer-facing pages MUST be mobile-first with touch targets minimum 44px tall and a maximum content width on large screens.
- **FR-033**: Admin panel MUST be mobile-first for on-the-go management and also provide a desktop-optimized layout for data-dense workflows while maintaining WCAG 2.2 Level AA accessibility compliance.
- **FR-033a**: Admin panel MUST be intuitive and easy to use with clearly defined features while preserving the overall site style and calming theme.
- **FR-033b**: System MUST maintain WCAG 2.2 Level AA accessibility compliance across all interfaces.

**Functional Programming Architecture (NON-NEGOTIABLE):**

- **FR-055**: System MUST be built entirely using functional programming patterns. NO class-based code is permitted. All code MUST use functions, pure transformations, and immutable data structures.
- **FR-056**: All React components MUST be functional components using React hooks exclusively. NO class components are permitted under any circumstance.
- **FR-057**: All service functions (AvailabilityService, BookingService, PaymentService, etc.) MUST be pure functions—identical inputs always produce identical outputs with no side effects. Services MUST be stateless and composable.
- **FR-058**: All data transformations MUST be immutable. Data updates MUST use spread operators, array methods (.map, .filter, .reduce), and functional utilities. NO object mutation or array mutation methods (splice, push, etc.) are permitted.
- **FR-059**: Custom React hooks MUST be used to encapsulate component logic. Complex state management MUST be extracted into hooks (e.g., useForm, useFetch, useValidation) for reusability and testability.
- **FR-060**: Database access and external service calls MUST be wrapped in pure service functions returning Promise-based results. Prisma queries MUST be composed into higher-order functions for clarity and testability.

**Safe & Clean JSX:**

- **FR-061**: All inline event handlers are FORBIDDEN. Event handlers MUST be defined as named functions at component scope and passed by reference (e.g., `onClick={handleSubmit}`, not `onClick={() => handleSubmit()}`).
- **FR-062**: JSX MUST NOT contain nested logic. Conditional rendering MUST use early returns or ternary operators at the top level. Complex JSX trees MUST be extracted into separate components.
- **FR-063**: NO `dangerouslySetInnerHTML` is permitted. All HTML content MUST be sanitized or use React's built-in escaping. If HTML rendering is required, use a safe sanitization library (e.g., DOMPurify).
- **FR-064**: All component props MUST be explicitly typed with TypeScript interfaces. NO `any` types on props. Props MUST be validated with Zod schemas at component entry boundaries if props come from external sources.
- **FR-065**: NO direct DOM manipulation using `useRef` except for focus management and form reset operations. All DOM updates MUST flow through React state and JSX.
- **FR-066**: List rendering MUST use stable `key` props. Keys MUST be unique identifiers, never array indices. Fragment children in lists MUST have `key` props.
- **FR-067**: All component prop destructuring MUST be explicit and typed. Components MUST validate incoming props conform to expected shape using Zod schemas if sourced externally.
- **FR-068**: No component should render JSX longer than 50 lines. Complex components MUST be decomposed into smaller, single-purpose functional components.

**Technical & Security:**

- **FR-034**: System MUST validate all API inputs using Zod schemas before processing.
- **FR-035**: System MUST log all booking creation, payment, and status change events with timestamps.
- **FR-036**: System MUST handle payment failures gracefully, preserving form data and displaying actionable error messages.
- **FR-037**: System MUST use environment variables for all secrets (Stripe keys, database credentials, email API keys).
- **FR-037a**: System MUST ensure environment files (e.g., .env) are excluded from version control and secrets are never exposed to client-side bundles.

### Key Entities

- **Service**: Represents a massage therapy offering. Attributes include unique identifier, name, description, duration in minutes, price in cents, down-payment amount in cents, and active status. Services are the catalog items customers book.

- **Booking**: Represents a customer appointment. Attributes include unique identifier, customer name, email, phone, selected service (foreign key), appointment start time (UTC), appointment end time (UTC), status (PENDING, CONFIRMED, COMPLETED, CANCELLED), Stripe payment intent ID (token reference only, no card data), Stripe customer ID (token reference), down-payment amount paid, remaining balance, creation timestamp, and last modified timestamp. **CRITICAL**: No payment card data is stored; only Stripe tokenized references. Bookings have a strict 1:1 relationship with Services (one booking = one service).

- **BusinessHours**: Represents standard operating schedule. Attributes include day of week (Monday-Sunday), opening time, closing time, and whether the day is open for business. Used for availability calculation.

- **DateOverride**: Represents exceptions to standard business hours. Attributes include specific date, whether the date is blocked or has custom hours, optional custom opening/closing times, and reason for override (e.g., "Holiday", "Staff Training"). Overrides take precedence over standard business hours.

- **SystemSettings**: Represents global configuration. Attributes include maximum bookings per day, buffer time between appointments (default 15 minutes), and other operational parameters. Changes are audited.

- **PaymentProvider** (interface/abstraction): Represents payment processing abstraction. Implementations handle provider-specific logic (Stripe implementation includes methods for creating payment intent, confirming payment, handling webhooks). Designed for future extensibility to support additional payment methods.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customers can complete the entire booking flow from service selection to payment confirmation in under 3 minutes on mobile devices.

- **SC-002**: System displays available time slots to customers within 2 seconds of date selection (including availability calculation with existing bookings).

- **SC-003**: 95% of booking confirmation emails with .ics attachments are delivered within 2 minutes of successful payment.

- **SC-004**: System achieves 0% double-bookings through atomic database transactions with row-level locking.

- **SC-005**: Customer-facing pages score 90+ on Lighthouse Performance metric and 100 on Accessibility metric.

- **SC-006**: Admin can configure business hours, date overrides, and daily booking cap within 5 minutes of accessing availability management interface.

- **SC-007**: System handles 50 concurrent users attempting to book simultaneously without performance degradation or booking conflicts.

- **SC-008**: 80% of customers successfully complete booking on first attempt without encountering errors or unclear instructions.

- **SC-009**: Admin dashboard loads "Today's Schedule" in under 1 second for up to 100 bookings per day.

- **SC-010**: System's payment processing maintains 99.9% uptime excluding Stripe service outages.

- **SC-011**: All customer-facing forms meet WCAG 2.2 Level AA contrast requirements (4.5:1 for normal text, 3:1 for large text).

- **SC-012**: Mobile users can successfully navigate and complete booking with touch-only input (no mouse required) on devices as small as 375px width.

- **SC-013**: System maintains PCI-DSS SAQ-A compliance with 100% of payment card data handled exclusively by Stripe (verified through quarterly reviews).

- **SC-014**: Zero customer payment card data is stored in application database or logs (verified through automated security scans and code reviews).

- **SC-015**: All webhook events are verified with valid Stripe signatures; 100% of events with invalid signatures are rejected and logged.

- **SC-016**: System successfully anonymizes customer PII from deleted booking records within 24 hours of deletion request while preserving financial audit trail.

## Assumptions

- **A-001**: TruFlow operates a single physical location with one therapist initially. Multi-location and multi-therapist support are future enhancements.

- **A-002**: Business hours are consistent week-to-week except for date-specific overrides. No support for alternating schedules (e.g., "first Monday of month closed").

- **A-003**: All prices and down-payments are in USD. Multi-currency support is not required initially.

- **A-004**: Customers are expected to pay remaining balance in-person; online payment of remaining balance is a future enhancement.

- **A-005**: The system sends booking confirmations and cancellations via email only; SMS notifications are a future enhancement.

- **A-006**: Admin authentication uses email/password system with support for multiple admin users (single role, identical permissions). Admin panel includes "Manage Admins" section to add/remove admin users. Password reset via email. OAuth, 2FA, and role-based access control (multiple roles with granular permissions) are future enhancements.

- **A-007**: The .ics file includes appointment details but not driving directions or custom reminders (can be added as enhancement).

- **A-008**: Stripe is the only payment provider at launch using Stripe Elements and PaymentIntents API (ensuring card data never touches our servers). Modular architecture allows future additions (PayPal, Square, etc.) provided they maintain same tokenization security model.

- **A-009**: Service images are optional initially and can be added as enhancement. Text descriptions are sufficient for MVP.

- **A-010**: Cancellations do not trigger automatic refunds; refund processing is manual and outside system scope initially.

- **A-011**: Customer data retention follows GDPR principles: (1) Completed/cancelled bookings older than 2 years have PII automatically purged (1 hour nightly job), preserving only anonymized financial records. (2) Customers can request immediate deletion of PII at any time via deletion request form with email verification. Deletion occurs within 1 hour of verified request with audit log entry. (3) Active and recent bookings (< 2 years) retain PII for operational and legal requirements. (4) Audit log of all deletions retained for 7 years for compliance verification.

- **A-012**: System assumes stable internet connectivity; offline booking is not supported.

- **A-013**: The calming aesthetic uses a neutral color palette with nature-inspired tones (specific colors defined in design phase, e.g., soft blues, greens, earth tones).

- **A-014**: System collects only essential PII (name, email, phone) required for booking confirmation and service delivery. No customer accounts, profiles, or marketing data are stored. Guest checkout model minimizes data footprint.

- **A-015**: SSL/TLS certificates are automatically managed by deployment platform (Vercel auto-renews Let's Encrypt certificates). No manual certificate management required.

## Dependencies

- **D-001**: Stripe account with PaymentIntents API access and webhook endpoint configured.

- **D-002**: Email service provider account (Resend or SendGrid) with transactional email API access.

- **D-003**: PostgreSQL database (development and production instances).

- **D-004**: Deployment platform (Vercel or alternative) with environment variable management.

- **D-005**: Domain name and SSL certificate for production deployment (TruFlow branding).

- **D-006**: Next.js, Tailwind CSS, MUI, Prisma, React Query, Zod, date-fns, and ics libraries installed and configured per constitution.

- **D-007**: Testing frameworks: Jest/Vitest for unit tests, Playwright for E2E tests.

- **D-008**: Storybook configured for component documentation.

- **D-009**: OpenAPI specification file (`spec/openapi.yaml`) defining all API endpoints before implementation.

- **D-010**: Stripe test mode account and test webhook endpoint configured for development environment.

- **D-011**: Security scanning tools for automated detection of secrets in code, vulnerable dependencies, and payment data leakage.

- **D-012**: PCI-DSS SAQ-A compliance documentation and annual self-assessment process.

## Out of Scope

- **OS-001**: Multi-location support (single location assumed).
- **OS-002**: Multi-therapist scheduling (single therapist assumed).
- **OS-003**: Customer account creation with saved preferences (guest checkout only).
- **OS-004**: Online payment of remaining balance (in-person only).
- **OS-005**: SMS notifications (email only).
- **OS-006**: Automatic refunds (for cancellations). Cancellation refunds are manual; automatic refunds are reserved for booking conflicts per FR-007b.
- **OS-007**: Gift certificate or voucher support.
- **OS-008**: Membership or subscription billing.
- **OS-009**: Integration with third-party calendar systems for admin (admin uses internal calendar only).
- **OS-010**: Customer reviews or ratings system.
- **OS-011**: Marketing features (email campaigns, promotions, discounts).
- **OS-012**: Multi-currency or international payment support.
- **OS-013**: Offline or progressive web app (PWA) functionality.
- **OS-014**: Customer loyalty program or referral system.
- **OS-015**: Advanced reporting and analytics (basic operational dashboard only).
- **OS-016**: Customer account creation with password storage (guest checkout only minimizes security surface).
- **OS-017**: Stored payment methods for repeat customers (payment info entered fresh each booking).
- **OS-018**: PCI-DSS Level 1 certification (SAQ-A self-assessment sufficient for tokenized payments).
- **OS-019**: Payment fraud detection beyond Stripe's built-in Radar (relying on Stripe's fraud prevention).
- **OS-020**: Multi-factor authentication for customers (no customer accounts to secure).

## Notes for Implementation

- **TDD Approach**: Following constitution's non-negotiable TDD requirement, all features must have tests written first. Recommended test order: (1) Availability calculation engine, (2) Booking creation with payment, (3) Email delivery, (4) Calendar generation, (5) Admin operations.

- **Storybook Components**: Build service card, calendar date picker, time slot selector, checkout form, and success page as isolated Storybook components before integration.

- **API-First**: Define all endpoints in OpenAPI spec before implementation. Example endpoints: `POST /api/bookings`, `GET /api/availability`, `GET /api/services`, `POST /api/webhooks/stripe`.

- **Accessibility Priority**: Use semantic HTML (`<main>`, `<nav>`, `<form>` elements), ensure keyboard navigation works for calendar date/time selection, provide skip links, and test with screen reader.

- **Mobile-First CSS**: Start with 375px width, then add responsive breakpoints using Tailwind's `sm:`, `md:`, `lg:` prefixes.

- **Modular Payment Interface**: Create `PaymentProvider` TypeScript interface with methods: `createPaymentIntent()`, `confirmPayment()`, `handleWebhook()`. Stripe implementation satisfies interface. Future providers implement same interface.

- **Buffer Time Logic**: When calculating available slots, each booking occupies `serviceDuration + 15 minutes`. Example: 60-min massage booked at 10:00 AM blocks 10:00-11:15 AM.

- **Daily Cap Logic**: Query count of bookings for target date. If count >= maxBookingsPerDay (from SystemSettings), mark entire date unavailable regardless of time slot availability.

- **Calming Design Tokens**: Define Tailwind configuration with custom colors (e.g., `calm-blue-50`, `calm-green-100`, `sand-200`) and spacing scale that promotes breathing room. Use soft shadows and rounded corners.

- **Environment Variables**: Required variables: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EMAIL_API_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

- **Database Migrations**: Use Prisma migrations for schema changes. Initial migration includes Service, Booking, BusinessHours, DateOverride, SystemSettings tables with proper indexes on Booking.startTime and Booking.status.

- **Error Handling**: Wrap all async operations in try/catch. Return structured errors: `{ error: string, code: string, details?: object }`. Log errors with context (user action, input data, stack trace).

- **Deployment Checklist**: (1) Run migrations, (2) Seed initial services and business hours, (3) Configure Stripe webhook URL, (4) Test email delivery in production, (5) Run E2E smoke tests against production.

- **Payment Security Implementation**: NEVER create server-side payment forms. Use Stripe Elements exclusively: `<script src="https://js.stripe.com/v3/"></script>`. Create PaymentIntent server-side with amount only, return client_secret to frontend. Frontend uses `stripe.confirmCardPayment(clientSecret, {payment_method: {card: cardElement}})`. Card data flows: Customer → Stripe (via Elements) → Webhook confirms → Update booking status. Zero card data touches our server.

- **Webhook Security**: In webhook handler, FIRST verify signature: `stripe.webhooks.constructEvent(req.body, signature, webhookSecret)`. Throw 400 if verification fails. THEN validate event type (only process `payment_intent.succeeded`, `payment_intent.payment_failed`). THEN validate amount matches booking. Use idempotency: check if event.id already processed before updating database.

- **Rate Limiting**: Use middleware (e.g., express-rate-limit or Next.js edge middleware) on `/api/bookings` and `/api/payment-intents`. Limit: 5 requests per IP per 15 minutes. Return 429 Too Many Requests with retry-after header. Log rate limit violations for security monitoring.

- **CSP Headers**: Set Content-Security-Policy: `default-src 'self'; script-src 'self' https://js.stripe.com; frame-src https://js.stripe.com; connect-src 'self' https://api.stripe.com`. This prevents XSS attacks while allowing Stripe integration.

- **Data Privacy**: Create scheduled job (e.g., daily cron) to purge PII from bookings older than 2 years where status is COMPLETED or CANCELLED. Replace `{name: 'John Doe', email: 'john@example.com', phone: '555-1234'}` with `{name: '[DELETED]', email: '[DELETED]', phone: '[DELETED]'}`. Keep booking ID, service, date, amounts for accounting. Log all deletions in audit table.

- **Secrets Management**: Required environment variables: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EMAIL_API_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `WEBHOOK_URL_TOKEN` (unguessable random string). NEVER commit .env files. Use Vercel's environment variable UI or platform-specific secret management. Rotate webhook secret quarterly.

- **Error Handling Security**: Catch all payment errors. Never expose: API keys, database errors, stack traces to customer. Transform errors: `{error: 'Payment failed', code: 'PAYMENT_DECLINED', userMessage: 'Your card was declined. Please try a different payment method.'}`. Log full error server-side with context (booking ID, customer email, timestamp, Stripe error code) but exclude card details.

- **Testing Security**: Write tests verifying: (1) Webhook with invalid signature is rejected, (2) Rate limiting blocks 6th request, (3) Payment form only uses Stripe Elements (no raw card inputs), (4) Database query returns no Booking records with raw card numbers, (5) Error responses contain no secrets, (6) HTTPS-only cookies are set correctly. Run security scan tools (npm audit, Snyk, OWASP ZAP) in CI/CD pipeline.

- **PCI Compliance**: Complete Stripe's SAQ-A questionnaire annually. Key SAQ-A requirements we satisfy: (1) Cardholder data never stored, processed, or transmitted through our servers (Stripe Elements handles this), (2) All pages HTTPS-only, (3) Environment properly segmented (prod vs dev), (4) Access controls on admin panel (authentication required), (5) Security patches applied regularly (Dependabot, npm audit). Document compliance in `.specify/compliance/pci-saq-a.md`.

- **Audit Logging**: Create `PaymentAuditLog` table with columns: id, timestamp, booking_id, action (INTENT_CREATED, PAYMENT_CONFIRMED, PAYMENT_FAILED, REFUND_ISSUED), amount_cents, stripe_event_id, stripe_payment_intent_id, ip_address, user_agent, outcome. Log every payment operation. Retain logs for 7 years (financial record retention requirement). Use logs for dispute resolution and fraud investigation.
