-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('SUCCESS', 'FAILED', 'RETRYING');

-- DropIndex
DROP INDEX "idx_admin_email";

-- DropIndex
DROP INDEX "idx_booking_recent";

-- DropIndex
DROP INDEX "idx_booking_service_starttime_status";

-- DropIndex
DROP INDEX "idx_booking_starttime";

-- DropIndex
DROP INDEX "idx_booking_status_balance";

-- DropIndex
DROP INDEX "idx_business_hours_dow";

-- DropIndex
DROP INDEX "idx_date_override_date";

-- DropIndex
DROP INDEX "idx_payment_audit_booking_action";

-- DropIndex
DROP INDEX "idx_payment_audit_outcome_created";

-- DropIndex
DROP INDEX "idx_payment_audit_stripe_event";

-- DropIndex
DROP INDEX "idx_service_active";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "email_delivery_status" "EmailDeliveryStatus" NOT NULL DEFAULT 'RETRYING';

-- CreateTable
CREATE TABLE "data_deletion_requests" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "requested_by_ip" TEXT,

    CONSTRAINT "data_deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_deletion_requests_token_key" ON "data_deletion_requests"("token");

-- CreateIndex
CREATE INDEX "data_deletion_requests_email_idx" ON "data_deletion_requests"("email");

-- CreateIndex
CREATE INDEX "data_deletion_requests_token_idx" ON "data_deletion_requests"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_email_idx" ON "password_reset_tokens"("email");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");
