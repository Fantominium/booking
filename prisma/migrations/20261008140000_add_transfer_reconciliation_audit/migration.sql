ALTER TYPE "PaymentAuditAction" ADD VALUE IF NOT EXISTS 'PAYMENT_RECEIVED';

ALTER TABLE "payment_audit_logs"
ADD COLUMN "external_transfer_reference" TEXT,
ADD COLUMN "verified_by_admin_id" TEXT;

CREATE UNIQUE INDEX "payment_audit_logs_external_transfer_reference_key"
ON "payment_audit_logs"("external_transfer_reference");