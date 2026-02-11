-- Performance optimization indexes for TruFlow Booking Platform
-- These indexes improve query performance for common operations

-- Booking queries optimization
-- Index for finding bookings by service and date range (availability calculations)
CREATE INDEX IF NOT EXISTS "idx_booking_service_starttime_status" 
ON "bookings" ("service_id", "start_time", "status");

-- Index for finding bookings by status and remaining balance (admin dashboard)
CREATE INDEX IF NOT EXISTS "idx_booking_status_balance" 
ON "bookings" ("status", "remaining_balance_cents");

-- Index for finding bookings by customer email (customer lookups)
CREATE INDEX IF NOT EXISTS "idx_booking_customer_email" 
ON "bookings" ("customer_email");

-- Index for finding bookings within date ranges (reporting)
CREATE INDEX IF NOT EXISTS "idx_booking_starttime" 
ON "bookings" ("start_time");

-- Service queries optimization  
-- Index for active services (public booking flow)
CREATE INDEX IF NOT EXISTS "idx_service_active" 
ON "services" ("isActive", "name");

-- BusinessHours queries optimization
-- Index for finding hours by day of week
CREATE INDEX IF NOT EXISTS "idx_business_hours_dow" 
ON "business_hours" ("day_of_week", "is_open");

-- DateOverride queries optimization
-- Index for finding date overrides (availability calculations)
CREATE INDEX IF NOT EXISTS "idx_date_override_date" 
ON "date_overrides" ("date");

-- PaymentAuditLog queries optimization
-- Index for finding audit logs by booking (refund SLA monitoring)
CREATE INDEX IF NOT EXISTS "idx_payment_audit_booking_action" 
ON "payment_audit_logs" ("booking_id", "action", "timestamp");

-- Index for finding audit logs by Stripe event ID (webhook idempotency)
CREATE INDEX IF NOT EXISTS "idx_payment_audit_stripe_event" 
ON "payment_audit_logs" ("stripe_event_id");

-- Index for finding audit logs by outcome and timestamp (monitoring)
CREATE INDEX IF NOT EXISTS "idx_payment_audit_outcome_created" 
ON "payment_audit_logs" ("outcome", "timestamp");

-- DataDeletionAuditLog queries optimization (if this table exists)
-- Index for finding deletions by email hash (compliance reporting)
-- CREATE INDEX IF NOT EXISTS "idx_data_deletion_email_hash" 
-- ON "DataDeletionAuditLog" ("emailHash", "createdAt");

-- Admin table optimization
-- Index for admin login by email
CREATE INDEX IF NOT EXISTS "idx_admin_email" 
ON "admins" ("email");

-- Composite indexes for complex queries
-- Index for finding upcoming bookings for a service
-- Removed non-immutable predicate to satisfy PostgreSQL index requirements.

-- Index for finding recent bookings (admin dashboard)
CREATE INDEX IF NOT EXISTS "idx_booking_recent" 
ON "bookings" ("created_at" DESC, "status");

-- Partial indexes for better performance on filtered queries
-- Index only for confirmed/pending bookings (availability calculations)
CREATE INDEX IF NOT EXISTS "idx_booking_active_service_time" 
ON "bookings" ("service_id", "start_time") 
WHERE "status" IN ('CONFIRMED', 'PENDING');

-- Index only for bookings with remaining balance (admin dashboard)
CREATE INDEX IF NOT EXISTS "idx_booking_unpaid" 
ON "bookings" ("remaining_balance_cents", "customer_name", "start_time") 
WHERE "remaining_balance_cents" > 0;

-- Index only for active services (public queries)
CREATE INDEX IF NOT EXISTS "idx_service_public" 
ON "services" ("name", "priceCents", "durationMin") 
WHERE "isActive" = true;