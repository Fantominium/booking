"use client";

import { useCallback, useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useQuery } from "@tanstack/react-query";

import { CheckoutForm } from "@/components/booking/CheckoutForm";
import { DatePicker } from "@/components/booking/DatePicker";
import { TimeSlotPicker, type TimeSlot } from "@/components/booking/TimeSlotPicker";
import { StripePaymentForm } from "@/components/payment/StripePaymentForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

type BookingFlowProps = {
  serviceId: string;
};

type BookingResponse = {
  id: string;
  clientSecret: string | null;
  paymentMethod: "CARD" | "BANK_TRANSFER";
  paymentState: "UNPAID" | "PENDING_BANK_TRANSFER" | "DEPOSIT_PAID" | "PAID_IN_FULL";
};

export const BookingFlow = ({ serviceId }: BookingFlowProps): React.JSX.Element => {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(undefined);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const endDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  }, []);

  const { data: availableDates = [] } = useQuery({
    queryKey: ["availability", "dates", serviceId, today, endDate],
    queryFn: async (): Promise<string[]> => {
      const response = await fetch(
        `/api/availability/${serviceId}?startDate=${today}&endDate=${endDate}`,
      );
      const data = (await response.json()) as { dates: string[] };
      return data.dates;
    },
  });

  const { data: slots = [] } = useQuery({
    queryKey: ["availability", "slots", serviceId, selectedDate],
    queryFn: async (): Promise<TimeSlot[]> => {
      if (!selectedDate) {
        return [];
      }
      const response = await fetch(
        `/api/availability/${serviceId}?startDate=${today}&date=${selectedDate}`,
      );
      const data = (await response.json()) as { slots: TimeSlot[] };
      return data.slots;
    },
    enabled: !!selectedDate,
  });

  const handleDateSelect = useCallback((date: string): void => {
    setSelectedDate(date);
    setSelectedSlot(undefined);
    setClientSecret(null);
    setBookingId(null);
  }, []);

  const handleSlotSelect = useCallback((slotStart: string) => {
    setSelectedSlot(slotStart);
  }, []);

  const handleCheckoutSubmit = useCallback(
    async (data: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      paymentMethod: "CARD" | "BANK_TRANSFER";
    }) => {
      if (!selectedSlot) {
        return;
      }

      setStatusMessage(null);

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          startTime: selectedSlot,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          paymentMethod: data.paymentMethod,
        }),
      });

      if (!response.ok) {
        setStatusMessage("We could not create your booking. Please review your details and try again.");
        return;
      }

      const booking = (await response.json()) as BookingResponse;

      setClientSecret(booking.clientSecret ?? null);
      setBookingId(booking.id);

      if (booking.paymentMethod === "BANK_TRANSFER") {
        globalThis.location.href = `/book/success?bookingId=${booking.id}`;
      }
    },
    [selectedSlot, serviceId],
  );

  const handlePaymentComplete = useCallback(() => {
    if (bookingId) {
      globalThis.location.href = `/book/success?bookingId=${bookingId}`;
    }
  }, [bookingId]);

  return (
    <div className="flex flex-col gap-6">
      {statusMessage ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {statusMessage}
        </p>
      ) : null}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-950">Select a date</h2>
        <DatePicker
          dates={availableDates}
          selectedDate={selectedDate}
          onSelect={handleDateSelect}
        />
      </section>

      {selectedDate ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-950">Select a time</h2>
          <TimeSlotPicker slots={slots} selectedStart={selectedSlot} onSelect={handleSlotSelect} />
        </section>
      ) : null}

      {selectedSlot ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Your details and payment choice</h2>
          <CheckoutForm onSubmit={handleCheckoutSubmit} />
        </section>
      ) : null}

      {clientSecret ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Card payment</h2>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripePaymentForm
              clientSecret={clientSecret}
              onPaymentComplete={handlePaymentComplete}
            />
          </Elements>
        </section>
      ) : null}
    </div>
  );
};
