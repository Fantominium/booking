"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { CheckoutForm } from "@/components/booking/CheckoutForm";
import { DatePicker } from "@/components/booking/DatePicker";
import { TimeSlotPicker, type TimeSlot } from "@/components/booking/TimeSlotPicker";
import { StripePaymentForm } from "@/components/payment/StripePaymentForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

type BookingFlowProps = {
  serviceId: string;
};

export const BookingFlow = ({ serviceId }: BookingFlowProps): JSX.Element => {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(undefined);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const loadDates = useCallback(async () => {
    const response = await fetch(
      `/api/availability/${serviceId}?startDate=${today}&endDate=${today}`,
    );
    const data = (await response.json()) as { dates: string[] };
    setAvailableDates(data.dates);
  }, [serviceId, today]);

  const loadSlots = useCallback(
    async (date: string) => {
      const response = await fetch(
        `/api/availability/${serviceId}?startDate=${today}&date=${date}`,
      );
      const data = (await response.json()) as { slots: TimeSlot[] };
      setSlots(data.slots);
    },
    [serviceId, today],
  );

  useEffect(() => {
    void loadDates();
  }, [loadDates]);

  const handleDateSelect = useCallback(
    (date: string) => {
      setSelectedDate(date);
      setSelectedSlot(undefined);
      setClientSecret(null);
      setBookingId(null);
      void loadSlots(date);
    },
    [loadSlots],
  );

  const handleSlotSelect = useCallback((slotStart: string) => {
    setSelectedSlot(slotStart);
  }, []);

  const handleCheckoutSubmit = useCallback(
    async (data: { customerName: string; customerEmail: string; customerPhone: string }) => {
      if (!selectedSlot) {
        return;
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          startTime: selectedSlot,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
        }),
      });

      const booking = (await response.json()) as {
        id: string;
        clientSecret: string | null;
      };

      setClientSecret(booking.clientSecret ?? null);
      setBookingId(booking.id);
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
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Select a date</h2>
        <DatePicker
          dates={availableDates}
          selectedDate={selectedDate}
          onSelect={handleDateSelect}
        />
      </section>

      {selectedDate ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Select a time</h2>
          <TimeSlotPicker slots={slots} selectedStart={selectedSlot} onSelect={handleSlotSelect} />
        </section>
      ) : null}

      {selectedSlot ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Your details</h2>
          <CheckoutForm onSubmit={handleCheckoutSubmit} />
        </section>
      ) : null}

      {clientSecret ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Payment</h2>
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
