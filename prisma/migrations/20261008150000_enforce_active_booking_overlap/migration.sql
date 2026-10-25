-- Replace the start-time-only unique index (which blocked re-booking a cancelled/expired
-- slot and did not stop unequal-start overlaps) with a database-enforced overlap guard
-- over all active reservations of the single shared provider resource.
--
-- Operator pre-check (must return zero rows before deploying):
--   SELECT a.id, b.id FROM bookings a JOIN bookings b
--     ON a.id < b.id AND a.start_time < b.end_time AND a.end_time > b.start_time
--   WHERE a.status NOT IN ('CANCELLED','EXPIRED') AND b.status NOT IN ('CANCELLED','EXPIRED');
--
-- Forward-fix / rollback: DROP the constraint below and recreate
--   CREATE UNIQUE INDEX "booking_service_start_unique" ON "bookings"("service_id","start_time");

DROP INDEX IF EXISTS "booking_service_start_unique";

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_active_overlap"
  EXCLUDE USING gist (tsrange("start_time", "end_time") WITH &&)
  WHERE ("status" NOT IN ('CANCELLED', 'EXPIRED'));
