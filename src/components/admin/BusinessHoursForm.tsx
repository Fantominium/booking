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

const createBlockRange = (): BusinessHours["blockedRanges"][number] => ({
  id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  startTime: "",
  endTime: "",
  reason: "",
});

const updateBlockedRange = (
  hours: BusinessHours[],
  dayOfWeek: number,
  blockId: string,
  field: "startTime" | "endTime" | "reason",
  value: string,
): BusinessHours[] => {
  const nextHours: BusinessHours[] = [];

  for (const entry of hours) {
    if (entry.dayOfWeek !== dayOfWeek) {
      nextHours.push(entry);
      continue;
    }

    const blockedRanges: BusinessHours["blockedRanges"] = [];

    for (const range of entry.blockedRanges) {
      blockedRanges.push(range.id === blockId ? { ...range, [field]: value } : range);
    }

    nextHours.push({ ...entry, blockedRanges });
  }

  return nextHours;
};

const removeBlockedRange = (
  hours: BusinessHours[],
  dayOfWeek: number,
  blockId: string,
): BusinessHours[] => {
  const nextHours: BusinessHours[] = [];

  for (const entry of hours) {
    if (entry.dayOfWeek !== dayOfWeek) {
      nextHours.push(entry);
      continue;
    }

    const blockedRanges = entry.blockedRanges.filter((range) => range.id !== blockId);
    nextHours.push({ ...entry, blockedRanges });
  }

  return nextHours;
};

export const BusinessHoursForm = ({ initialHours }: BusinessHoursFormProps): JSX.Element => {
  const [hours, setHours] = useState<BusinessHours[]>(sortByDay(initialHours));
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedDays, setExpandedDays] = useState<number[]>([]);
  const [editingBlocks, setEditingBlocks] = useState<Map<number, string[]>>(new Map());

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

  const handleBlockChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const dayOfWeek = Number(event.target.dataset.day ?? 0);
    const blockId = event.target.dataset.blockId;
    const field = event.target.dataset.field as "startTime" | "endTime" | "reason" | undefined;

    if (!blockId || !field) {
      return;
    }

    setHours((prev) => updateBlockedRange(prev, dayOfWeek, blockId, field, event.target.value));
  }, []);

  const handleAddBlock = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const dayOfWeek = Number(event.currentTarget.dataset.day ?? 0);

    setHours((prev) =>
      prev.map((entry) =>
        entry.dayOfWeek === dayOfWeek
          ? { ...entry, blockedRanges: [...entry.blockedRanges, createBlockRange()] }
          : entry,
      ),
    );
    setExpandedDays((prev) => (prev.includes(dayOfWeek) ? prev : [...prev, dayOfWeek]));
  }, []);

  const handleRemoveBlock = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const dayOfWeek = Number(event.currentTarget.dataset.day ?? 0);
    const blockId = event.currentTarget.dataset.blockId;

    if (!blockId) {
      return;
    }

    setHours((prev) => removeBlockedRange(prev, dayOfWeek, blockId));
    setEditingBlocks((prev) => {
      const next = new Map(prev);
      const current = next.get(dayOfWeek) ?? [];
      next.set(
        dayOfWeek,
        current.filter((id) => id !== blockId),
      );
      return next;
    });
  }, []);

  const handleEditBlock = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const dayOfWeek = Number(event.currentTarget.dataset.day ?? 0);
    const blockId = event.currentTarget.dataset.blockId;

    if (!blockId) {
      return;
    }

    setEditingBlocks((prev) => {
      const next = new Map(prev);
      const current = next.get(dayOfWeek) ?? [];
      if (current.includes(blockId)) {
        next.set(
          dayOfWeek,
          current.filter((id) => id !== blockId),
        );
        return next;
      }

      next.set(dayOfWeek, [...current, blockId]);
      return next;
    });
  }, []);

  const toggleExpandedDay = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const dayOfWeek = Number(event.currentTarget.dataset.day ?? 0);

    setExpandedDays((prev) =>
      prev.includes(dayOfWeek) ? prev.filter((day) => day !== dayOfWeek) : [...prev, dayOfWeek],
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
      className="dark:bg-surface-elevated flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Business hours</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Update your weekly availability. Times use your local timezone.
        </p>
      </div>

      <div className="grid gap-4">
        {rows.map((entry) => (
          <div
            key={entry.dayOfWeek}
            className="dark:bg-surface grid gap-3 rounded-lg border border-slate-100 p-4 dark:border-slate-700"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {dayLabels[entry.dayOfWeek] ?? `Day ${entry.dayOfWeek}`}
              </div>
              <button
                type="button"
                data-day={entry.dayOfWeek}
                onClick={toggleExpandedDay}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                aria-expanded={expandedDays.includes(entry.dayOfWeek)}
                aria-label={`Toggle unavailable ranges for ${dayLabels[entry.dayOfWeek] ?? "day"}`}
              >
                {expandedDays.includes(entry.dayOfWeek)
                  ? "Hide unavailable ranges"
                  : "Add unavailable range"}
              </button>
            </div>
            {entry.blockedRanges.length > 0 ? (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Blocked:</span>
                {entry.blockedRanges.map((range) => (
                  <span
                    key={`${entry.dayOfWeek}-${range.id}-hint`}
                    className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {range.startTime || "--:--"} - {range.endTime || "--:--"}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hint: add unavailable ranges to block breaks or existing commitments.
              </p>
            )}
            <div className="grid gap-3 md:grid-cols-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={entry.isOpen}
                  data-day={entry.dayOfWeek}
                  onChange={handleToggleOpen}
                  aria-label={`Toggle ${dayLabels[entry.dayOfWeek] ?? "day"} availability`}
                />
                <span>Open</span>
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                <span>Open</span>
                <input
                  type="time"
                  value={entry.openingTime ?? ""}
                  data-day={entry.dayOfWeek}
                  data-field="openingTime"
                  onChange={handleTimeChange}
                  disabled={!entry.isOpen}
                  className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
                  aria-label={`${dayLabels[entry.dayOfWeek] ?? "day"} opening time`}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                <span>Close</span>
                <input
                  type="time"
                  value={entry.closingTime ?? ""}
                  data-day={entry.dayOfWeek}
                  data-field="closingTime"
                  onChange={handleTimeChange}
                  disabled={!entry.isOpen}
                  className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
                  aria-label={`${dayLabels[entry.dayOfWeek] ?? "day"} closing time`}
                />
              </label>
            </div>

            {expandedDays.includes(entry.dayOfWeek) ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Unavailable ranges
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      These times will not be bookable.
                    </div>
                  </div>
                  <button
                    type="button"
                    data-day={entry.dayOfWeek}
                    onClick={handleAddBlock}
                    className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-blue-300 dark:text-slate-950"
                  >
                    Add range
                  </button>
                </div>

                <div className="grid gap-3">
                  {entry.blockedRanges.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      No unavailable ranges added.
                    </p>
                  ) : null}
                  {entry.blockedRanges.map((range) => {
                    const isEditing = (editingBlocks.get(entry.dayOfWeek) ?? []).includes(range.id);

                    return (
                      <div
                        key={range.id}
                        className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm text-slate-700 dark:text-slate-200">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {range.startTime || "--:--"} - {range.endTime || "--:--"}
                            </p>
                            {range.reason ? (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {range.reason}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              data-day={entry.dayOfWeek}
                              data-block-id={range.id}
                              onClick={handleEditBlock}
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                              aria-label={`${isEditing ? "Done editing" : "Edit"} unavailable range ${range.startTime || "--:--"} to ${range.endTime || "--:--"}`}
                            >
                              {isEditing ? "Done" : "Edit"}
                            </button>
                            <button
                              type="button"
                              data-day={entry.dayOfWeek}
                              data-block-id={range.id}
                              onClick={handleRemoveBlock}
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="mt-3 grid gap-2 md:grid-cols-3">
                            <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                              <span>Start</span>
                              <input
                                type="time"
                                value={range.startTime}
                                data-day={entry.dayOfWeek}
                                data-block-id={range.id}
                                data-field="startTime"
                                onChange={handleBlockChange}
                                className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                              <span>End</span>
                              <input
                                type="time"
                                value={range.endTime}
                                data-day={entry.dayOfWeek}
                                data-block-id={range.id}
                                data-field="endTime"
                                onChange={handleBlockChange}
                                className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                              <span>Note</span>
                              <input
                                type="text"
                                value={range.reason ?? ""}
                                data-day={entry.dayOfWeek}
                                data-block-id={range.id}
                                data-field="reason"
                                onChange={handleBlockChange}
                                placeholder="Optional"
                                className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
                              />
                            </label>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600 dark:text-slate-300">{status}</span>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-blue-300 dark:text-slate-950"
          disabled={isSaving}
          aria-label="Save business hours"
        >
          {isSaving ? "Saving" : "Save changes"}
        </button>
      </div>
    </form>
  );
};
