"use client";

import type React from "react";
import { useCallback, useState } from "react";

import type { SystemSettings } from "@/types/settings";

type SystemSettingsFormProps = {
  initialSettings: SystemSettings;
};

type SettingsDraft = {
  maxBookingsPerDay: string;
  bufferMinutes: string;
};

export const SystemSettingsForm = ({ initialSettings }: SystemSettingsFormProps): JSX.Element => {
  const [draft, setDraft] = useState<SettingsDraft>({
    maxBookingsPerDay: String(initialSettings.maxBookingsPerDay),
    bufferMinutes: String(initialSettings.bufferMinutes),
  });
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const field = event.target.dataset.field as keyof SettingsDraft | undefined;
    const value = event.target.value;

    if (!field) {
      return;
    }

    setDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSaving(true);
      setStatus(null);

      try {
        const response = await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            maxBookingsPerDay: Number(draft.maxBookingsPerDay),
            bufferMinutes: Number(draft.bufferMinutes),
          }),
        });

        if (!response.ok) {
          setStatus("Unable to update settings.");
          return;
        }

        setStatus("Settings updated.");
      } catch {
        setStatus("Unable to update settings.");
      } finally {
        setIsSaving(false);
      }
    },
    [draft],
  );

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-slate-900">System settings</h2>
        <p className="text-sm text-slate-600">Control booking caps and buffer time.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>Max bookings per day</span>
          <input
            type="number"
            min={1}
            value={draft.maxBookingsPerDay}
            data-field="maxBookingsPerDay"
            onChange={handleChange}
            className="rounded-md border border-slate-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>Buffer minutes</span>
          <input
            type="number"
            min={0}
            value={draft.bufferMinutes}
            data-field="bufferMinutes"
            onChange={handleChange}
            className="rounded-md border border-slate-300 px-2 py-1"
          />
        </label>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">{status}</span>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          disabled={isSaving}
          aria-label="Save system settings"
        >
          {isSaving ? "Saving" : "Save settings"}
        </button>
      </div>
    </form>
  );
};
