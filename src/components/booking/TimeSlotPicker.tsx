"use client";

import type React from "react";
import { useCallback } from "react";

export type TimeSlot = {
  start: string;
  end: string;
};

type TimeSlotPickerProps = {
  slots: TimeSlot[];
  selectedStart?: string;
  onSelect: (start: string) => void;
};

export const TimeSlotPicker = ({
  slots,
  selectedStart,
  onSelect,
}: TimeSlotPickerProps): JSX.Element => {
  const handleSelect = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const value = event.currentTarget.dataset.start;
      if (value) {
        onSelect(value);
      }
    },
    [onSelect],
  );

  return (
    <div className="grid grid-cols-2 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.start}
          type="button"
          data-start={slot.start}
          data-testid="time-slot"
          aria-label={`Select time ${new Date(slot.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          onClick={handleSelect}
          className={`rounded-md border px-3 py-2 text-sm ${
            selectedStart === slot.start
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          {new Date(slot.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </button>
      ))}
    </div>
  );
};
