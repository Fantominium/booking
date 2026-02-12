"use client";

import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod";

export type ServiceFormValues = {
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  downpaymentCents: number;
  isActive: boolean;
};

type ServiceFormProps = {
  initialValues: ServiceFormValues;
  onSubmit: (values: ServiceFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel: string;
  variant?: "modal" | "inline";
};

const serviceSchema: z.ZodTypeAny = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    durationMin: z.number().int().positive("Duration must be greater than 0"),
    priceCents: z.number().int().nonnegative("Price is required"),
    downpaymentCents: z.number().int().nonnegative("Downpayment is required"),
    isActive: z.boolean(),
  })
  .refine((value) => value.downpaymentCents <= value.priceCents, {
    message: "Downpayment cannot exceed price",
    path: ["downpaymentCents"],
  });

export const ServiceForm = ({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  variant = "modal",
}: ServiceFormProps): JSX.Element => {
  const [values, setValues] = useState<ServiceFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const formClassName = useMemo(() => {
    return variant === "inline" ? "grid gap-3" : "grid gap-4";
  }, [variant]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.target;
      const field = target.dataset.field as keyof ServiceFormValues | undefined;
      if (!field) {
        return;
      }

      const value =
        target instanceof HTMLInputElement && target.type === "checkbox"
          ? target.checked
          : target.value;

      setValues((prev) => ({
        ...prev,
        [field]:
          field === "durationMin" || field === "priceCents" || field === "downpaymentCents"
            ? Number(value)
            : value,
      }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      const input: Record<string, unknown> = {
        name: values.name,
        description: values.description,
        durationMin: values.durationMin,
        priceCents: values.priceCents,
        downpaymentCents: values.downpaymentCents,
        isActive: values.isActive,
      };

      try {
        serviceSchema.parse(input);
      } catch (validationError) {
        console.error(validationError);
        setError("Invalid service details");
        return;
      }

      setIsSaving(true);
      try {
        await onSubmit(values);
      } catch (submitError) {
        console.error(submitError);
        setError("Unable to save service.");
      } finally {
        setIsSaving(false);
      }
    },
    [onSubmit, values],
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  return (
    <form className={formClassName} onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        <span>Name</span>
        <input
          type="text"
          value={values.name}
          data-field="name"
          onChange={handleChange}
          className="rounded-md border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        <span>Description</span>
        <textarea
          value={values.description}
          data-field="description"
          onChange={handleChange}
          className="rounded-md border border-slate-200 px-3 py-2"
          rows={3}
        />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>Duration (min)</span>
          <input
            type="number"
            value={values.durationMin}
            data-field="durationMin"
            onChange={handleChange}
            className="rounded-md border border-slate-200 px-3 py-2"
            min={1}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>Price (cents)</span>
          <input
            type="number"
            value={values.priceCents}
            data-field="priceCents"
            onChange={handleChange}
            className="rounded-md border border-slate-200 px-3 py-2"
            min={0}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>Downpayment (cents)</span>
          <input
            type="number"
            value={values.downpaymentCents}
            data-field="downpaymentCents"
            onChange={handleChange}
            className="rounded-md border border-slate-200 px-3 py-2"
            min={0}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={values.isActive}
          data-field="isActive"
          onChange={handleChange}
        />
        <span>Active</span>
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          disabled={isSaving}
        >
          {isSaving ? "Saving" : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            onClick={handleCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
};
