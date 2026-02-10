-- Performance optimization indexes for TruFlow Booking Platform
-- These indexes improve query performance for common operations

-- Booking queries optimization
-- Index for finding bookings by service and date range (availability calculations)
CREATE INDEX IF NOT EXISTS "idx_booking_service_starttime_status" 
ON "Booking" ("serviceId", "startTime", "status");

-- Index for finding bookings by status and remaining balance (admin dashboard)
CREATE INDEX IF NOT EXISTS "idx_booking_status_balance" 
ON "Booking" ("status", "remainingBalanceCents");

-- Index for finding bookings by customer email (customer lookups)
CREATE INDEX IF NOT EXISTS "idx_booking_customer_email" 
ON "Booking" ("customerEmail");

-- Index for finding bookings within date ranges (reporting)
CREATE INDEX IF NOT EXISTS "idx_booking_starttime" 
ON "Booking" ("startTime");

-- Service queries optimization  
-- Index for active services (public booking flow)
CREATE INDEX IF NOT EXISTS "idx_service_active" 
ON "Service" ("isActive", "name");

-- BusinessHours queries optimization
-- Index for finding hours by day of week
CREATE INDEX IF NOT EXISTS "idx_business_hours_dow" 
ON "BusinessHours" ("dayOfWeek", "isOpen");

-- DateOverride queries optimization
-- Index for finding date overrides (availability calculations)
CREATE INDEX IF NOT EXISTS "idx_date_override_date" 
ON "DateOverride" ("date");

-- PaymentAuditLog queries optimization
-- Index for finding audit logs by booking (refund SLA monitoring)
CREATE INDEX IF NOT EXISTS "idx_payment_audit_booking_action" 
ON "PaymentAuditLog" ("bookingId", "action", "createdAt");

-- Index for finding audit logs by Stripe event ID (webhook idempotency)
CREATE INDEX IF NOT EXISTS "idx_payment_audit_stripe_event" 
ON "PaymentAuditLog" ("stripeEventId");

-- Index for finding audit logs by outcome and timestamp (monitoring)
CREATE INDEX IF NOT EXISTS "idx_payment_audit_outcome_created" 
ON "PaymentAuditLog" ("outcome", "createdAt");

-- DataDeletionAuditLog queries optimization (if this table exists)
-- Index for finding deletions by email hash (compliance reporting)
-- CREATE INDEX IF NOT EXISTS "idx_data_deletion_email_hash" 
-- ON "DataDeletionAuditLog" ("emailHash", "createdAt");

-- Admin table optimization
-- Index for admin login by email
CREATE INDEX IF NOT EXISTS "idx_admin_email" 
ON "Admin" ("email");

-- Composite indexes for complex queries
-- Index for finding upcoming bookings for a service
CREATE INDEX IF NOT EXISTS "idx_booking_service_upcoming" 
ON "Booking" ("serviceId", "startTime", "status") 
WHERE "startTime" > NOW();

-- Index for finding recent bookings (admin dashboard)
CREATE INDEX IF NOT EXISTS "idx_booking_recent" 
ON "Booking" ("createdAt" DESC, "status");

-- Partial indexes for better performance on filtered queries
-- Index only for confirmed/pending bookings (availability calculations)
CREATE INDEX IF NOT EXISTS "idx_booking_active_service_time" 
ON "Booking" ("serviceId", "startTime") 
WHERE "status" IN ('CONFIRMED', 'PENDING');

-- Index only for bookings with remaining balance (admin dashboard)
CREATE INDEX IF NOT EXISTS "idx_booking_unpaid" 
ON "Booking" ("remainingBalanceCents", "customerName", "startTime") 
WHERE "remainingBalanceCents" > 0;

-- Index only for active services (public queries)
CREATE INDEX IF NOT EXISTS "idx_service_public" 
ON "Service" ("name", "priceCents", "durationMin") 
WHERE "isActive" = true;