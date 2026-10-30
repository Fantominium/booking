-- Preserve the legacy buffer already represented by stored end_time values.
DO $$
DECLARE
  legacy_buffer integer;
BEGIN
  SELECT MIN("buffer_minutes") INTO legacy_buffer FROM "system_settings";

  IF legacy_buffer IS NOT NULL AND legacy_buffer < 60 THEN
    UPDATE "bookings"
    SET "end_time" = "end_time" + make_interval(mins => 60 - legacy_buffer)
    WHERE "status"::text NOT IN ('CANCELLED', 'EXPIRED');

    IF EXISTS (
      SELECT 1
      FROM "bookings" a
      JOIN "bookings" b
        ON a."id" < b."id"
       AND a."start_time" < b."end_time"
       AND a."end_time" > b."start_time"
      WHERE a."status"::text NOT IN ('CANCELLED', 'EXPIRED')
        AND b."status"::text NOT IN ('CANCELLED', 'EXPIRED')
    ) THEN
      RAISE EXCEPTION 'Backfilling the 60-minute buffer would create overlapping bookings; resolve conflicts manually';
    END IF;
  END IF;
END $$;

UPDATE "system_settings"
SET "buffer_minutes" = 60
WHERE "buffer_minutes" < 60;

ALTER TABLE "system_settings"
ALTER COLUMN "buffer_minutes" SET DEFAULT 60;

ALTER TABLE "bookings"
ALTER COLUMN "payment_method" SET DEFAULT 'BANK_TRANSFER',
ALTER COLUMN "payment_state" SET DEFAULT 'PENDING_BANK_TRANSFER';