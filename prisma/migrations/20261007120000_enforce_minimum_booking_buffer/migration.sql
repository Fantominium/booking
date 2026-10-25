UPDATE "system_settings"
SET "buffer_minutes" = 60
WHERE "buffer_minutes" < 60;

ALTER TABLE "system_settings"
ALTER COLUMN "buffer_minutes" SET DEFAULT 60;

ALTER TABLE "bookings"
ALTER COLUMN "payment_method" SET DEFAULT 'BANK_TRANSFER',
ALTER COLUMN "payment_state" SET DEFAULT 'PENDING_BANK_TRANSFER';