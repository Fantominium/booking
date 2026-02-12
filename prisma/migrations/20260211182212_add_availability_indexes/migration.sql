-- CreateIndex
CREATE INDEX "bookings_start_time_idx" ON "bookings"("start_time");

-- CreateIndex
CREATE INDEX "bookings_service_id_start_time_status_idx" ON "bookings"("service_id", "start_time", "status");
