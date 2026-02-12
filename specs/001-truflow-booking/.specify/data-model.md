# Data Model: TruFlow Booking Platform

**Feature**: [001-truflow-booking](../spec.md)  
**Design Phase**: Phase 1  
**Date**: 2026-02-03  

---

## Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│    Service      │         │    Booking      │
├─────────────────┤    1:N   ├─────────────────┤
│ id (PK)         │◄─────────│ id (PK)         │
│ name            │         │ service_id (FK) │
│ description     │         │ customer_name   │
│ duration_min    │         │ customer_email  │
│ price_cents     │         │ customer_phone  │
│ downpayment_cents          │ start_time      │
│ is_active       │         │ end_time        │
│ created_at      │         │ status          │
│ updated_at      │         │ stripe_payment_intent_id│
└─────────────────┘         │ stripe_customer_id│
                            │ downpayment_paid_cents│
                            │ remaining_balance_cents│
                            │ created_at      │
                            │ updated_at      │
                            └─────────────────┘

┌──────────────────────┐
│   BusinessHours      │
├──────────────────────┤
│ id (PK)              │
│ day_of_week (0-6)    │
│ opening_time         │
│ closing_time         │
│ is_open              │
└──────────────────────┘

┌──────────────────────┐
│   DateOverride       │
├──────────────────────┤
│ id (PK)              │
│ date                 │
│ is_blocked           │
│ custom_open_time     │
│ custom_close_time    │
│ reason               │
└──────────────────────┘

┌──────────────────────┐
│  SystemSettings      │
├──────────────────────┤
│ id (PK)              │
│ max_bookings_per_day │
│ buffer_minutes       │
│ updated_at           │
└──────────────────────┘

┌──────────────────────┐
│ PaymentAuditLog      │
├──────────────────────┤
│ id (PK)              │
│ booking_id (FK)      │
│ timestamp            │
│ action               │
│ amount_cents         │
│ stripe_event_id      │
│ stripe_payment_intent│
│ ip_address           │
│ user_agent           │
│ outcome              │
│ error_message        │
└──────────────────────┘

┌──────────────────────┐
│DataDeletionAuditLog  │
├──────────────────────┤
│ id (PK)              │
│ timestamp            │
│ original_email_hash  │
│ deletion_reason      │
│ requested_by_ip      │
│ status               │
└──────────────────────┘
```

---

## Entity Definitions

### Service

Represents a massage therapy offering in the catalog.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID (PK) | NOT NULL, UNIQUE | Unique identifier |
| `name` | String(255) | NOT NULL, UNIQUE | Service name (e.g., "Deep Tissue Massage") |
| `description` | Text | NULLABLE | Detailed service description |
| `duration_min` | Integer | NOT NULL, > 0 | Service duration in minutes (e.g., 60) |
| `price_cents` | Integer | NOT NULL, >= 0 | Full service price in cents (e.g., 8000 for $80) |
| `downpayment_cents` | Integer | NOT NULL, >= 0 | Required down-payment in cents (e.g., 2000 for $20) |
| `is_active` | Boolean | NOT NULL, DEFAULT true | Whether service is available for booking |
| `created_at` | Timestamp | NOT NULL, DEFAULT now() | Creation timestamp (UTC) |
| `updated_at` | Timestamp | NOT NULL, DEFAULT now() | Last modification timestamp (UTC) |

**Validation Rules**:
- `duration_min` must be > 0 (cannot have 0-minute service)
- `price_cents` must be >= 0 (price can be $0 for promotional services)
- `downpayment_cents` must be <= `price_cents` (down-payment cannot exceed full price)
- `name` is unique; prevents duplicate service names in catalog
- `description` can be NULL for MVP; images are out-of-scope (OS-009)

**Relationships**:
- 1:N with `Booking` (one service can have many bookings)

**Usage**:
- Displayed on customer-facing service catalog (FR-001)
- Used to calculate appointment duration and buffer time (FR-016)
- Admin can create, update, delete services (FR-023, FR-024, FR-025)

---

### Booking

Represents a customer appointment.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID (PK) | NOT NULL, UNIQUE | Unique booking identifier |
| `service_id` | UUID (FK) | NOT NULL | Foreign key to Service |
| `customer_name` | String(255) | NOT NULL | Customer's full name |
| `customer_email` | String(255) | NOT NULL | Customer's email for confirmation |
| `customer_phone` | String(20) | NOT NULL | Customer's phone number |
| `start_time` | Timestamp | NOT NULL, UNIQUE (composite: service_id + start_time) | Appointment start time (UTC); index on this column |
| `end_time` | Timestamp | NOT NULL | Appointment end time (UTC) = start_time + duration + buffer |
| `status` | Enum | NOT NULL, DEFAULT 'PENDING' | PENDING, CONFIRMED, COMPLETED, CANCELLED; index on this column |
| `stripe_payment_intent_id` | String(255) | NULLABLE, UNIQUE | Stripe PaymentIntent ID (token reference only, never card data) |
| `stripe_customer_id` | String(255) | NULLABLE | Stripe Customer ID (token reference) |
| `downpayment_paid_cents` | Integer | NOT NULL, DEFAULT 0 | Down-payment amount customer paid (in cents) |
| `remaining_balance_cents` | Integer | NOT NULL | Remaining balance due in-person (price - downpayment) |
| `created_at` | Timestamp | NOT NULL, DEFAULT now() | Booking creation timestamp (UTC) |
| `updated_at` | Timestamp | NOT NULL, DEFAULT now() | Last modification timestamp (UTC) |

**Validation Rules**:
- `customer_name` is required; must be non-empty string
- `customer_email` must be valid email format (validated client-side + server-side with Zod)
- `customer_phone` must be valid international phone format (FR-006)
- `start_time` uniqueness constraint: No two bookings can start at same time for same service; prevents double-bookings at database level
- `end_time` = `start_time` + `service.duration_min` + `SystemSettings.buffer_minutes` (calculated, not user-provided)
- `status` transitions: PENDING → CONFIRMED → COMPLETED (or CANCELLED at any point)
- `downpayment_paid_cents` = `service.downpayment_cents` after successful payment
- `remaining_balance_cents` = `service.price_cents - downpayment_paid_cents`

**CRITICAL**: No raw card data stored; only Stripe token IDs (FR-046, FR-049)

**Relationships**:
- N:1 with `Service` (many bookings can reference one service)
- 1:N with `PaymentAuditLog` (one booking can have many audit entries)

**Usage**:
- Created when customer completes payment (FR-008)
- Updated when payment confirmed via Stripe webhook (FR-008)
- Marked COMPLETED when remaining balance paid in-person (FR-019)
- Cancelled when customer or admin cancels (FR-020)
- Filtered/searched on admin dashboard (FR-017, FR-018a)

**Indices**:
- `(service_id, start_time)` composite unique index (prevent double-bookings)
- `(status)` for filtering (e.g., find all CONFIRMED bookings)
- `(customer_email)` for searching by email
- `(created_at)` for sorting/pagination

---

### BusinessHours

Represents the standard operating schedule for each day of the week.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID (PK) | NOT NULL, UNIQUE | Unique identifier |
| `day_of_week` | Integer | NOT NULL, 0-6, UNIQUE | 0=Monday, 1=Tuesday, ... 6=Sunday |
| `opening_time` | Time | NULLABLE | Opening time (HH:MM in 24-hour format); NULL if day closed |
| `closing_time` | Time | NULLABLE | Closing time (HH:MM in 24-hour format); NULL if day closed |
| `is_open` | Boolean | NOT NULL, DEFAULT true | Whether business is open this day |

**Validation Rules**:
- `day_of_week` is unique; one row per day
- If `is_open = true`, both `opening_time` and `closing_time` must be NOT NULL
- If `is_open = false`, `opening_time` and `closing_time` should be NULL
- `closing_time` > `opening_time` (e.g., 09:00 < 17:00)
- Times are in 24-hour format (e.g., 14:30 for 2:30 PM)

**Usage**:
- Admin configures via "Availability Management" UI (FR-012)
- Used to calculate available time slots (FR-016)
- Customer sees only dates within these hours (FR-002, FR-003)
- Changes take effect immediately (FR-015)

**Example Data**:
```
| day_of_week | opening_time | closing_time | is_open |
|-------------|--------------|--------------|---------|
| 0           | 09:00        | 17:00        | true    |  Monday
| 1           | 09:00        | 17:00        | true    |  Tuesday
| 2           | 09:00        | 17:00        | true    |  Wednesday
| 3           | 09:00        | 17:00        | true    |  Thursday
| 4           | 09:00        | 17:00        | true    |  Friday
| 5           | NULL         | NULL         | false   |  Saturday
| 6           | NULL         | NULL         | false   |  Sunday
```

---

### DateOverride

Represents exceptions to standard business hours (e.g., holidays, special closures).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID (PK) | NOT NULL, UNIQUE | Unique identifier |
| `date` | Date | NOT NULL, UNIQUE | Specific date (YYYY-MM-DD); unique per date |
| `is_blocked` | Boolean | NOT NULL | true = day closed; false = custom hours |
| `custom_open_time` | Time | NULLABLE | Custom opening time (only if is_blocked = false) |
| `custom_close_time` | Time | NULLABLE | Custom closing time (only if is_blocked = false) |
| `reason` | String(255) | NULLABLE | Reason for override (e.g., "Christmas Holiday") |

**Validation Rules**:
- `date` is unique; one override per date maximum
- If `is_blocked = true`, `custom_open_time` and `custom_close_time` should be NULL
- If `is_blocked = false`, both `custom_open_time` and `custom_close_time` must be NOT NULL
- `custom_close_time` > `custom_open_time`
- Overrides take precedence over `BusinessHours` (FR-013)

**Usage**:
- Admin creates via "Availability Management" (FR-013)
- Used to calculate available slots; checked before `BusinessHours` (FR-016)
- Customer sees date as unavailable if `is_blocked = true` (FR-002)

**Example Data**:
```
| date       | is_blocked | custom_open | custom_close | reason               |
|------------|------------|-------------|--------------|----------------------|
| 2026-12-25 | true       | NULL        | NULL         | Christmas Holiday    |
| 2026-07-04 | true       | NULL        | NULL         | Independence Day      |
| 2026-05-20 | false      | 10:00       | 14:00        | Afternoon only event |
```

---

### SystemSettings

Represents global system configuration (singleton table; one row).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID (PK) | NOT NULL, UNIQUE | Singleton ID (always 1) |
| `max_bookings_per_day` | Integer | NOT NULL, DEFAULT 8, >= 1 | Maximum bookings allowed per day |
| `buffer_minutes` | Integer | NOT NULL, DEFAULT 15, >= 0 | Buffer time after each booking (in minutes) |
| `updated_at` | Timestamp | NOT NULL, DEFAULT now() | Last modification timestamp (UTC) |

**Validation Rules**:
- `max_bookings_per_day` >= 1; cannot be 0
- `buffer_minutes` >= 0; can be 0 if no buffer desired (though not recommended)
- Only one row in table (enforced via primary key constraint)

**Usage**:
- Admin configures via admin panel (FR-014)
- Used in availability calculation: if daily booking count >= max, date marked unavailable (FR-016, Edge Case: Max daily bookings)
- Buffer applied to every booking: `slot_end = start + service.duration + buffer` (FR-016)
- Changes effective immediately (FR-015)

**Usage Example**:
```typescript
// Pseudo-code for availability calculation
const settings = await getSystemSettings()
const bookingsToday = await countBookings(date, NOT CANCELLED)
if (bookingsToday >= settings.max_bookings_per_day) {
  return [] // No slots available; date is full
}
```

---

### PaymentAuditLog

Represents audit trail for payment operations (required for financial compliance and PCI-DSS SAQ-A).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID (PK) | NOT NULL, UNIQUE | Unique audit entry ID |
| `booking_id` | UUID (FK) | NOT NULL | Foreign key to Booking (for linking) |
| `timestamp` | Timestamp | NOT NULL, DEFAULT now() | Exact time of operation (UTC) |
| `action` | Enum | NOT NULL | INTENT_CREATED, PAYMENT_CONFIRMED, PAYMENT_FAILED, REFUND_ISSUED, REFUND_FAILED |
| `amount_cents` | Integer | NOT NULL, >= 0 | Amount involved (in cents) |
| `stripe_event_id` | String(255) | NULLABLE | Stripe webhook event ID (e.g., evt_xxx) |
| `stripe_payment_intent_id` | String(255) | NULLABLE | Stripe PaymentIntent ID (e.g., pi_xxx); NO card data |
| `ip_address` | String(45) | NULLABLE | Customer IP address (IPv4 or IPv6) |
| `user_agent` | String(500) | NULLABLE | Customer's browser user agent |
| `outcome` | Enum | NOT NULL | SUCCESS, FAILED, PENDING |
| `error_message` | String(500) | NULLABLE | Error message if outcome = FAILED (sanitized; no sensitive data) |

**Validation Rules**:
- `action` must be one of predefined values
- `amount_cents` >= 0; never negative
- `stripe_event_id` and `stripe_payment_intent_id` contain ONLY Stripe token IDs; NO card numbers, CVV, or expiration dates
- `outcome` must match action (e.g., PAYMENT_CONFIRMED → SUCCESS; PAYMENT_FAILED → FAILED)
- `error_message` is sanitized; never includes API keys, stack traces, or system internals (FR-045)

**Data Retention**:
- Retained for 7 years (financial record retention requirement; FR-044)
- Annual cleanup job deletes entries older than 7 years
- Exported quarterly for compliance audits

**Usage**:
- Logged on every payment operation (FR-044, FR-035)
- Queried for dispute resolution and fraud investigation
- Compliance audit: Sum amounts by status to verify payment totals
- Admin visibility: Dashboard can show "Recent Payment Activity"

**Example Entries**:
```
| booking_id | timestamp           | action             | amount_cents | outcome | stripe_event_id  |
|------------|---------------------|-------------------|--------------|---------|------------------|
| abc123     | 2026-02-10 10:15:00 | INTENT_CREATED    | 2000         | SUCCESS | evt_xxx1         |
| abc123     | 2026-02-10 10:16:30 | PAYMENT_CONFIRMED | 2000         | SUCCESS | evt_xxx2         |
| def456     | 2026-02-10 10:20:00 | INTENT_CREATED    | 3500         | SUCCESS | evt_xxx3         |
| def456     | 2026-02-10 10:21:00 | PAYMENT_FAILED    | 3500         | FAILED  | evt_xxx4         |
| def456     | 2026-02-10 10:40:00 | REFUND_ISSUED     | 3500         | SUCCESS | (none)           |
```

---

### DataDeletionAuditLog

Represents audit trail for customer PII deletion requests (required for GDPR compliance).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID (PK) | NOT NULL, UNIQUE | Unique audit entry ID |
| `timestamp` | Timestamp | NOT NULL, DEFAULT now() | Time of deletion (UTC) |
| `original_email_hash` | String(64) | NOT NULL | SHA-256 hash of customer's email (NOT plaintext); indexed for queries |
| `deletion_reason` | Enum | NOT NULL | CUSTOMER_REQUEST, AUTO_PURGE_AGE, GDPR_RIGHT_TO_BE_FORGOTTEN |
| `requested_by_ip` | String(45) | NULLABLE | IP address that initiated deletion (if customer-initiated) |
| `status` | Enum | NOT NULL | SUCCESS, FAILED, PENDING |

**Validation Rules**:
- `original_email_hash` is SHA-256 of email; never stores plaintext email (privacy-safe)
- `deletion_reason` must be predefined value
- `status` tracks whether deletion completed successfully

**Data Retention**:
- Retained for 7 years (GDPR audit requirement)
- Enables compliance audits: "How many customers requested deletion?"
- Supports dispute resolution: "What was the deletion date for customer X?"

**Usage**:
- Logged when customer requests deletion (FR-052)
- Logged when automated purge job runs (FR-051)
- Compliance audit: Queries by `timestamp` to verify timely processing
- No PII stored in this table; hashes only

**Example Entries**:
```
| original_email_hash              | deletion_reason       | status  | timestamp           |
|----------------------------------|-----------------------|---------|---------------------|
| 7e8f9c1d2e3f4g5h6i7j8k9l0m1n2o3 | CUSTOMER_REQUEST      | SUCCESS | 2026-02-10 14:30:00 |
| 9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4 | AUTO_PURGE_AGE        | SUCCESS | 2026-02-11 02:00:00 |
| 1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6 | GDPR_RIGHT_TO_BE_FORGOTTEN | SUCCESS | 2026-02-12 11:45:00 |
```

---

## Database Schema: Prisma Schema File

### Location
`schema.prisma` (in `prisma/` directory; see quickstart.md for setup)

### Key Constraints & Indices

```prisma
// Example Prisma schema structure

model Service {
  id                   String   @id @default(uuid())
  name                 String   @unique
  description          String?
  durationMin          Int      @gt(0)
  priceCents           Int      @gte(0)
  downpaymentCents     Int      @gte(0)
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  
  bookings             Booking[]
  
  @@map("services")
}

model Booking {
  id                   String   @id @default(uuid())
  serviceId            String
  customerName         String
  customerEmail        String
  customerPhone        String
  startTime            DateTime
  endTime              DateTime
  status               BookingStatus @default(PENDING)
  stripePaymentIntentId String?  @unique
  stripeCustomerId     String?
  downpaymentPaidCents Int      @default(0)
  remainingBalanceCents Int
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  
  service              Service  @relation(fields: [serviceId], references: [id])
  auditLogs            PaymentAuditLog[]
  
  @@unique([serviceId, startTime])  // Prevent double-bookings
  @@index([status])
  @@index([customerEmail])
  @@index([createdAt])
  @@map("bookings")
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}

model BusinessHours {
  id          String   @id @default(uuid())
  dayOfWeek   Int      @unique  // 0-6
  openingTime String?  // "09:00"
  closingTime String?  // "17:00"
  isOpen      Boolean  @default(true)
  
  @@map("business_hours")
}

model DateOverride {
  id               String   @id @default(uuid())
  date             DateTime @unique @db.Date
  isBlocked        Boolean
  customOpenTime   String?  // "10:00"
  customCloseTime  String?  // "14:00"
  reason           String?
  
  @@map("date_overrides")
}

model SystemSettings {
  id               String   @id @default(uuid())
  maxBookingsPerDay Int     @default(8) @gte(1)
  bufferMinutes    Int      @default(15) @gte(0)
  updatedAt        DateTime @updatedAt
  
  @@map("system_settings")
}

model PaymentAuditLog {
  id                  String   @id @default(uuid())
  bookingId           String
  timestamp           DateTime @default(now())
  action              PaymentAction
  amountCents         Int      @gte(0)
  stripeEventId       String?
  stripePaymentIntentId String?
  ipAddress           String?
  userAgent           String?
  outcome             PaymentOutcome
  errorMessage        String?
  
  booking             Booking  @relation(fields: [bookingId], references: [id])
  
  @@index([bookingId])
  @@index([timestamp])
  @@map("payment_audit_logs")
}

enum PaymentAction {
  INTENT_CREATED
  PAYMENT_CONFIRMED
  PAYMENT_FAILED
  REFUND_ISSUED
  REFUND_FAILED
}

enum PaymentOutcome {
  SUCCESS
  FAILED
  PENDING
}

model DataDeletionAuditLog {
  id              String   @id @default(uuid())
  timestamp       DateTime @default(now())
  originalEmailHash String  // SHA-256 hash
  deletionReason  DeletionReason
  requestedByIp   String?
  status          DeletionStatus
  
  @@index([timestamp])
  @@map("data_deletion_audit_logs")
}

enum DeletionReason {
  CUSTOMER_REQUEST
  AUTO_PURGE_AGE
  GDPR_RIGHT_TO_BE_FORGOTTEN
}

enum DeletionStatus {
  SUCCESS
  FAILED
  PENDING
}
```

---

## Validation Rules Summary

### Input Validation (Server-side with Zod)

```typescript
// Example Zod schemas (pseudo-code)

export const CreateBookingSchema = z.object({
  serviceId: z.string().uuid(),
  customerName: z.string().min(1).max(255),
  customerEmail: z.string().email(),
  customerPhone: z.string().regex(/^[+]?[0-9\s\-()]+$/), // International format
  startTime: z.date(),
})

export const CreateServiceSchema = z.object({
  name: z.string().min(1).max(255).unique(),
  description: z.string().max(1000).optional(),
  durationMin: z.number().int().gt(0),
  priceCents: z.number().int().gte(0),
  downpaymentCents: z.number().int().gte(0)
    .refine((val, ctx) => {
      return val <= ctx.data.priceCents
    }, { message: 'Down-payment cannot exceed price' })
})
```

---

## Migration Strategy

### Initial Migration (Schema Creation)

All tables created in single migration: `001_initial_schema.sql`

### Data Seeding

Seed script creates:
- Default `BusinessHours` (Mon-Fri 9 AM–5 PM, Sat-Sun closed)
- Default `SystemSettings` (max 8 bookings/day, 15-min buffer)
- 3-5 sample `Service` entries (for testing)

### Future Migrations

Use Prisma migrations for all schema changes:
```bash
npx prisma migrate dev --name descriptive_name
```

---

## No Circular Dependencies

✅ All foreign keys resolve correctly  
✅ No self-referential entities (except as noted)  
✅ Clear parent-child relationships  
✅ Audit tables are append-only (no foreign key back to Booking except for querying)  

---

## Ready for API Contract Definition

Data model is complete and ready to inform OpenAPI specification generation.
