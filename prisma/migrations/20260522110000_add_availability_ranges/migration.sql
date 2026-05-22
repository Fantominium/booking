-- CreateTable
CREATE TABLE "business_hours_blocks" (
    "id" TEXT NOT NULL,
    "business_hours_id" TEXT NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "reason" TEXT,

    CONSTRAINT "business_hours_blocks_pkey" PRIMARY KEY ("id")
);

-- Backfill date override ranges before switching columns
ALTER TABLE "date_overrides"
ADD COLUMN "start_date" DATE,
ADD COLUMN "end_date" DATE;

UPDATE "date_overrides"
SET "start_date" = "date",
    "end_date" = "date";

ALTER TABLE "date_overrides"
ALTER COLUMN "start_date" SET NOT NULL,
ALTER COLUMN "end_date" SET NOT NULL;

ALTER TABLE "date_overrides"
DROP CONSTRAINT IF EXISTS "date_overrides_date_key";

ALTER TABLE "date_overrides"
DROP COLUMN "date";

CREATE INDEX "business_hours_blocks_business_hours_id_idx" ON "business_hours_blocks"("business_hours_id");
CREATE INDEX "date_overrides_start_date_end_date_idx" ON "date_overrides"("start_date", "end_date");

ALTER TABLE "business_hours_blocks"
ADD CONSTRAINT "business_hours_blocks_business_hours_id_fkey"
FOREIGN KEY ("business_hours_id") REFERENCES "business_hours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
