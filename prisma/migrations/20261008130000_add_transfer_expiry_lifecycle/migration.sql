ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "PaymentState" ADD VALUE IF NOT EXISTS 'PENDING_BANK_TRANSFER_REVIEW';
ALTER TYPE "PaymentState" ADD VALUE IF NOT EXISTS 'EXPIRED';

ALTER TABLE "bookings"
ADD COLUMN "transfer_expires_at" TIMESTAMP(3),
ADD COLUMN "review_grace_expires_at" TIMESTAMP(3);

UPDATE "bookings"
SET "transfer_expires_at" = "created_at" + INTERVAL '24 hours'
WHERE "payment_state" = 'PENDING_BANK_TRANSFER'
  AND "transfer_expires_at" IS NULL;