"use client";

import type React from "react";
import { useCallback, useMemo, useState } from "react";

import type { BusinessHours } from "@/types/availability";

type BusinessHoursFormProps = {
  initialHours: BusinessHours[];
};

const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const sortByDay = (hours: BusinessHours[]): BusinessHours[] => {
  return [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
};

export const BusinessHoursForm = ({ initialHours }: BusinessHoursFormProps): JSX.Element => {
  const [hours, setHours] = useState<BusinessHours[]>(sortByDay(initialHours));
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const rows = useMemo(() => sortByDay(hours), [hours]);

  const handleToggleOpen = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const dayOfWeek = Number(event.target.dataset.day ?? 0);
    const isOpen = event.target.checked;

    setHours((prev) =>
      prev.map((entry) => (entry.dayOfWeek === dayOfWeek ? { ...entry, isOpen } : entry)),
    );
  }, []);

  const handleTimeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const dayOfWeek = Number(event.target.dataset.day ?? 0);
    const field = event.target.dataset.field as "openingTime" | "closingTime" | undefined;
    const value = event.target.value;

    if (!field) {
      return;
    }

    setHours((prev) =>
      prev.map((entry) =>
        entry.dayOfWeek === dayOfWeek ? { ...entry, [field]: value || null } : entry,
      ),
    );
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSaving(true);
      setStatus(null);

      try {
        const response = await fetch("/api/admin/business-hours", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessHours: hours }),
        });

        if (!response.ok) {
          setStatus("Unable to save business hours.");
          return;
        }

        const data = (await response.json()) as { businessHours: BusinessHours[] };
        setHours(sortByDay(data.businessHours));
        setStatus("Business hours updated.");
      } catch {
        setStatus("Unable to save business hours.");
      } finally {
        setIsSaving(false);
      }
    },
    [hours],
  );

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-slate-900">Business hours</h2>
        <p className="text-sm text-slate-600">
          Update your weekly availability. Times use your local timezone.
        </p>
      </div>

      <div className="grid gap-4">
        {rows.map((entry) => (
          <div
            key={entry.dayOfWeek}
            className="grid gap-3 rounded-lg border border-slate-100 p-4 md:grid-cols-4"
          >
            <div className="text-sm font-semibold text-slate-900">
              {dayLabels[entry.dayOfWeek] ?? `Day ${entry.dayOfWeek}`}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={entry.isOpen}
                data-day={entry.dayOfWeek}
                onChange={handleToggleOpen}
                aria-label={`Toggle ${dayLabels[entry.dayOfWeek] ?? "day"} availability`}
              />
              Open
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span>Open</span>
              <input
                type="time"
                value={entry.openingTime ?? ""}
                data-day={entry.dayOfWeek}
                data-field="openingTime"
                onChange={handleTimeChange}
                disabled={!entry.isOpen}
                className="rounded-md border border-slate-300 px-2 py-1"
                aria-label={`${dayLabels[entry.dayOfWeek] ?? "day"} opening time`}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span>Close</span>
              <input
                type="time"
                value={entry.closingTime ?? ""}
                data-day={entry.dayOfWeek}
                data-field="closingTime"
                onChange={handleTimeChange}
                disabled={!entry.isOpen}
                className="rounded-md border border-slate-300 px-2 py-1"
                aria-label={`${dayLabels[entry.dayOfWeek] ?? "day"} closing time`}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">{status}</span>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          disabled={isSaving}
          aria-label="Save business hours"
        >
          {isSaving ? "Saving" : "Save changes"}
        </button>
      </div>
    </form>
  );
};
