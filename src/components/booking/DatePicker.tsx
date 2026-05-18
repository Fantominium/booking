"use client";

import type React from "react";
import { useCallback, useMemo } from "react";

type DatePickerProps = {
  dates: string[];
  selectedDate?: string;
  onSelect: (date: string) => void;
};

export const DatePicker = ({ dates, selectedDate, onSelect }: DatePickerProps): JSX.Element => {
  const availableDates = useMemo(() => [...dates].sort(), [dates]);
  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);

  const minDate = availableDates[0];
  const maxDate = availableDates.at(-1);

  const handleDateFieldChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const value = event.currentTarget.value;

      if (!value) {
        return;
      }

      if (!availableDateSet.has(value)) {
        event.currentTarget.setCustomValidity("This date is not available for booking.");
        event.currentTarget.reportValidity();
        return;
      }

      event.currentTarget.setCustomValidity("");
      onSelect(value);
    },
    [availableDateSet, onSelect],
  );

  return (
    <div className="flex flex-col gap-3" data-testid="calendar">
      <input
        type="date"
        data-testid="date-input"
        value={selectedDate ?? ""}
        onChange={handleDateFieldChange}
        min={minDate}
        max={maxDate}
        disabled={!availableDates.length}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        aria-label="Select booking date"
      />
    </div>
  );
};
