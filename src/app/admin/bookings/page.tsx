"use client";

import { useCallback, useMemo, useState } from "react";

import { BookingList } from "@/components/admin/BookingList";
import { EmailResendButton } from "@/components/admin/EmailResendButton";
import type { AdminBooking } from "@/types/booking";

const formatMoney = (amountCents: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
};

const BookingManagementPage = (): JSX.Element => {
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);

  const handleSelect = useCallback((booking: AdminBooking | null) => {
    setSelectedBooking(booking);
  }, []);

  const handleResendComplete = useCallback(() => {
    return;
  }, []);

  const paymentStatus = useMemo(() => {
    if (!selectedBooking) {
      return "";
    }

    if (selectedBooking.remainingBalanceCents === 0) {
      return "Paid in full";
    }

    return `Balance due: ${formatMoney(selectedBooking.remainingBalanceCents)}`;
  }, [selectedBooking]);

  const emailStatusLabel = useMemo(() => {
    if (!selectedBooking) {
      return "";
    }

    if (selectedBooking.emailDeliveryStatus === "SUCCESS") {
      return "Delivered";
    }

    if (selectedBooking.emailDeliveryStatus === "FAILED") {
      return "Failed";
    }

    return "Retrying";
  }, [selectedBooking]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 bg-slate-50 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">Booking management</h1>
        <p className="text-slate-700">
          Filter bookings, confirm payments, and cancel appointments.
        </p>
      </header>

      <BookingList onSelectBooking={handleSelect} />

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Booking details</h2>
        {selectedBooking ? (
          <div className="mt-4 grid gap-2 text-sm text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">Customer:</span>{" "}
              {selectedBooking.customerName}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Service:</span>{" "}
              {selectedBooking.serviceName}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Start:</span>{" "}
              {new Date(selectedBooking.startTime).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Status:</span> {selectedBooking.status}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Payment status:</span> {paymentStatus}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Email status:</span> {emailStatusLabel}
            </div>
            <div className="pt-2">
              <EmailResendButton bookingId={selectedBooking.id} onComplete={handleResendComplete} />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">Select a booking to view details.</p>
        )}
      </section>
    </main>
  );
};

export default BookingManagementPage;
