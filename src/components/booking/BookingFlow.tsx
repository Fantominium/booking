"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CheckoutForm } from "@/components/booking/CheckoutForm";
import { DatePicker } from "@/components/booking/DatePicker";
import { TimeSlotPicker, type TimeSlot } from "@/components/booking/TimeSlotPicker";

type BookingFlowProps = {
  serviceId: string;
  selectedDurationMin: number;
  selectedPriceCents: number;
};

type BookingResponse = {
  id: string;
};

export const BookingFlow = ({
  serviceId,
  selectedDurationMin,
  selectedPriceCents,
}: BookingFlowProps): React.JSX.Element => {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const selectedSlotRef = useRef<string | undefined>(undefined);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const endDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  }, []);

  const { data: availableDates = [] } = useQuery({
    queryKey: ["availability", "dates", serviceId, selectedDurationMin, today, endDate],
    queryFn: async (): Promise<string[]> => {
      const response = await fetch(
        `/api/availability/${serviceId}?startDate=${today}&endDate=${endDate}&durationMin=${selectedDurationMin}`,
      );
      const data = (await response.json()) as { dates: string[] };
      return data.dates;
    },
  });

  const { data: slots = [] } = useQuery({
    queryKey: ["availability", "slots", serviceId, selectedDurationMin, selectedDate],
    queryFn: async (): Promise<TimeSlot[]> => {
      if (!selectedDate) {
        return [];
      }
      const response = await fetch(
        `/api/availability/${serviceId}?startDate=${today}&date=${selectedDate}&durationMin=${selectedDurationMin}`,
      );
      const data = (await response.json()) as { slots: TimeSlot[] };
      return data.slots;
    },
    enabled: !!selectedDate,
  });

  const handleDateSelect = useCallback((date: string): void => {
    setSelectedDate(date);
    setSelectedSlot(undefined);
    selectedSlotRef.current = undefined;
    idempotencyKeyRef.current = null;
  }, []);

  const handleSlotSelect = useCallback((slotStart: string) => {
    if (selectedSlotRef.current !== slotStart) {
      idempotencyKeyRef.current = null;
      selectedSlotRef.current = slotStart;
    }
    setSelectedSlot(slotStart);
  }, []);

  const handleCheckoutSubmit = useCallback(
    async (data: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      paymentMethod: "BANK_TRANSFER";
    }) => {
      if (!selectedSlot) {
        return;
      }

      setStatusMessage(null);
      const idempotencyKey = idempotencyKeyRef.current ?? globalThis.crypto.randomUUID();
      idempotencyKeyRef.current = idempotencyKey;

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          serviceId,
          startTime: selectedSlot,
          selectedDurationMin,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          paymentMethod: "BANK_TRANSFER",
        }),
      });

      if (!response.ok) {
        if (response.status < 500) {
          idempotencyKeyRef.current = null;
        }
        setStatusMessage(
          "We could not create your booking. Please review your details and try again.",
        );
        return;
      }

      const booking = (await response.json()) as BookingResponse;
      idempotencyKeyRef.current = null;
      globalThis.location.href = `/book/success?bookingId=${booking.id}`;
    },
    [selectedDurationMin, selectedSlot, serviceId],
  );

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
          <p className="text-sm text-slate-700">
            Selected treatment length: {selectedDurationMin} minutes. Session price: $
            {(selectedPriceCents / 100).toFixed(0)} Bds.
          </p>
          <CheckoutForm onSubmit={handleCheckoutSubmit} />
        </section>
      ) : null}
    </div>
  );
};
