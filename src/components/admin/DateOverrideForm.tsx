"use client";

import type React from "react";
import { useCallback, useMemo, useState } from "react";

import type { DateOverride } from "@/types/availability";

type DateOverrideFormProps = {
  initialOverrides: DateOverride[];
};

type OverrideDraft = {
  date: string;
  isBlocked: boolean;
  customOpenTime: string;
  customCloseTime: string;
  reason: string;
};

const createEmptyDraft = (): OverrideDraft => ({
  date: "",
  isBlocked: false,
  customOpenTime: "",
  customCloseTime: "",
  reason: "",
});

const sortOverrides = (items: DateOverride[]): DateOverride[] => {
  return [...items].sort((a, b) => a.date.localeCompare(b.date));
};

export const DateOverrideForm = ({ initialOverrides }: DateOverrideFormProps): JSX.Element => {
  const [overrides, setOverrides] = useState<DateOverride[]>(sortOverrides(initialOverrides));
  const [draft, setDraft] = useState<OverrideDraft>(createEmptyDraft());
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const rows = useMemo(() => sortOverrides(overrides), [overrides]);

  const handleDraftChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const field = event.target.dataset.field as keyof OverrideDraft | undefined;
    const value = event.target.value;

    if (!field) {
      return;
    }

    setDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleBlockedChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const isBlocked = event.target.checked;
    setDraft((prev) => ({ ...prev, isBlocked }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSaving(true);
      setStatus(null);

      try {
        const response = await fetch("/api/admin/date-overrides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: draft.date,
            isBlocked: draft.isBlocked,
            customOpenTime: draft.customOpenTime || null,
            customCloseTime: draft.customCloseTime || null,
            reason: draft.reason || null,
          }),
        });

        if (!response.ok) {
          setStatus("Unable to add date override.");
          return;
        }

        const data = (await response.json()) as DateOverride;
        setOverrides((prev) => sortOverrides([...prev, data]));
        setDraft(createEmptyDraft());
        setStatus("Date override added.");
      } catch {
        setStatus("Unable to add date override.");
      } finally {
        setIsSaving(false);
      }
    },
    [draft],
  );

  const handleDelete = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    const id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }

    setStatus(null);

    try {
      const response = await fetch(`/api/admin/date-overrides/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setStatus("Unable to delete date override.");
        return;
      }

      setOverrides((prev) => prev.filter((entry) => entry.id !== id));
      setStatus("Date override removed.");
    } catch {
      setStatus("Unable to delete date override.");
    }
  }, []);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-slate-900">Date overrides</h2>
        <p className="text-sm text-slate-600">Add holiday closures or special opening hours.</p>
      </div>

      <form className="grid gap-4 md:grid-cols-5" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>Date</span>
          <input
            type="date"
            value={draft.date}
            data-field="date"
            onChange={handleDraftChange}
            className="rounded-md border border-slate-300 px-2 py-1"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>Open</span>
          <input
            type="time"
            value={draft.customOpenTime}
            data-field="customOpenTime"
            onChange={handleDraftChange}
            className="rounded-md border border-slate-300 px-2 py-1"
            disabled={draft.isBlocked}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>Close</span>
          <input
            type="time"
            value={draft.customCloseTime}
            data-field="customCloseTime"
            onChange={handleDraftChange}
            className="rounded-md border border-slate-300 px-2 py-1"
            disabled={draft.isBlocked}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>Reason</span>
          <input
            type="text"
            value={draft.reason}
            data-field="reason"
            onChange={handleDraftChange}
            className="rounded-md border border-slate-300 px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={draft.isBlocked}
            onChange={handleBlockedChange}
            aria-label="Mark date as fully blocked"
          />
          Blocked
        </label>
        <div className="flex items-center justify-between md:col-span-5">
          <span className="text-sm text-slate-600">{status}</span>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            disabled={isSaving}
            aria-label="Add date override"
          >
            {isSaving ? "Saving" : "Add override"}
          </button>
        </div>
      </form>

      <div className="grid gap-3">
        {rows.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-col text-sm text-slate-700">
              <span className="font-semibold text-slate-900">{entry.date}</span>
              <span>
                {entry.isBlocked
                  ? "Blocked"
                  : `Open ${entry.customOpenTime ?? "--"} - ${entry.customCloseTime ?? "--"}`}
              </span>
              {entry.reason ? <span className="text-slate-500">{entry.reason}</span> : null}
            </div>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700"
              data-id={entry.id}
              onClick={handleDelete}
              aria-label={`Delete override for ${entry.date}`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
