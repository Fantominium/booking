CREATE TYPE "OfferingType" AS ENUM ('SESSION', 'EVENT', 'RENTAL');

CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER');

CREATE TYPE "PaymentState" AS ENUM ('UNPAID', 'PENDING_BANK_TRANSFER', 'DEPOSIT_PAID', 'PAID_IN_FULL');

ALTER TABLE "services"
ADD COLUMN "offering_type" "OfferingType" NOT NULL DEFAULT 'SESSION';

ALTER TABLE "bookings"
ADD COLUMN "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CARD',
ADD COLUMN "payment_state" "PaymentState" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN "bank_transfer_reference" TEXT;

ALTER TABLE "system_settings"
ADD COLUMN "bank_transfer_instructions" TEXT;

UPDATE "services"
SET "offering_type" = CASE
  WHEN LOWER("name") LIKE '%event%' THEN 'EVENT'::"OfferingType"
  WHEN LOWER("name") LIKE '%rental%' THEN 'RENTAL'::"OfferingType"
  ELSE 'SESSION'::"OfferingType"
END;