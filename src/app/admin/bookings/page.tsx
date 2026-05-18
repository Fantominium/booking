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

    if (selectedBooking.paymentState === "PENDING_BANK_TRANSFER") {
      return "Awaiting bank transfer";
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
    <main className="mx-auto flex max-w-6xl flex-col gap-6 bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.18),transparent_45%),linear-gradient(180deg,#fdfefe_0%,#f5f7fb_100%)] px-6 py-10 dark:bg-[radial-gradient(circle_at_top,rgba(144,202,249,0.12),transparent_45%),linear-gradient(180deg,#121212_0%,#171717_100%)]">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Booking management</h1>
        <p className="text-slate-700 dark:text-slate-200">
          Filter bookings, confirm payments, and cancel appointments.
        </p>
      </header>

      <BookingList onSelectBooking={handleSelect} />

      <section className="dark:bg-surface-elevated rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Booking details</h2>
        {selectedBooking ? (
          <div className="mt-4 grid gap-2 text-sm text-slate-700 dark:text-slate-200">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Customer:</span>{" "}
              {selectedBooking.customerName}
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Service:</span>{" "}
              {selectedBooking.serviceName}
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Start:</span>{" "}
              {new Date(selectedBooking.startTime).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Status:</span>{" "}
              {selectedBooking.status}
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Payment status:</span>{" "}
              {paymentStatus}
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Payment method:</span>{" "}
              {selectedBooking.paymentMethod === "BANK_TRANSFER" ? "Bank transfer" : "Card"}
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Email status:</span>{" "}
              {emailStatusLabel}
            </div>
            <div className="pt-2">
              <EmailResendButton bookingId={selectedBooking.id} onComplete={handleResendComplete} />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Select a booking to view details.
          </p>
        )}
      </section>
    </main>
  );
};

export default BookingManagementPage;
