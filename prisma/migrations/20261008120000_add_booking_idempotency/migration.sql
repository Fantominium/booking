CREATE TABLE "booking_idempotency" (
    "id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "request_fingerprint" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_idempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "booking_idempotency_idempotency_key_key"
ON "booking_idempotency"("idempotency_key");

CREATE UNIQUE INDEX "booking_idempotency_booking_id_key"
ON "booking_idempotency"("booking_id");

CREATE INDEX "booking_idempotency_expires_at_idx"
ON "booking_idempotency"("expires_at");

ALTER TABLE "booking_idempotency"
ADD CONSTRAINT "booking_idempotency_booking_id_fkey"
FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;