"use client";

import type React from "react";
import { useCallback } from "react";

type DatePickerProps = {
  dates: string[];
  selectedDate?: string;
  onSelect: (date: string) => void;
};

export const DatePicker = ({ dates, selectedDate, onSelect }: DatePickerProps): JSX.Element => {
  const handleSelect = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const value = event.currentTarget.dataset.date;
      if (value) {
        onSelect(value);
      }
    },
    [onSelect],
  );

  return (
    <div className="grid grid-cols-2 gap-2">
      {dates.map((date) => (
        <button
          key={date}
          type="button"
          data-date={date}
          aria-label={`Select date ${date}`}
          onClick={handleSelect}
          className={`rounded-md border px-3 py-2 text-sm ${
            selectedDate === date
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          {date}
        </button>
      ))}
    </div>
  );
};
