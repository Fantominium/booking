"use client";

import type React from "react";
import { useCallback, useState } from "react";

export type CheckoutData = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: "BANK_TRANSFER";
};

type CheckoutFormProps = {
  onSubmit: (data: CheckoutData) => Promise<void>;
};

type UseCheckoutFormReturn = {
  formData: CheckoutData;
  isSubmitting: boolean;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
};

const useCheckoutForm = (
  onSubmit: (data: CheckoutData) => Promise<void>,
): UseCheckoutFormReturn => {
  const [formData, setFormData] = useState<CheckoutData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    paymentMethod: "BANK_TRANSFER",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit],
  );

  return { formData, isSubmitting, handleChange, handleSubmit };
};

export const CheckoutForm = ({ onSubmit }: CheckoutFormProps): JSX.Element => {
  const { formData, isSubmitting, handleChange, handleSubmit } = useCheckoutForm(onSubmit);

  return (
    <form className="flex flex-col gap-4" data-testid="customer-form" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        <span>Full name</span>
        <input
          className="rounded-xl border border-slate-300 px-3 py-3 text-slate-900"
          name="customerName"
          value={formData.customerName}
          onChange={handleChange}
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        <span>Email</span>
        <input
          className="rounded-xl border border-slate-300 px-3 py-3 text-slate-900"
          name="customerEmail"
          type="email"
          value={formData.customerEmail}
          onChange={handleChange}
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        <span>Phone</span>
        <input
          className="rounded-xl border border-slate-300 px-3 py-3 text-slate-900"
          name="customerPhone"
          value={formData.customerPhone}
          onChange={handleChange}
          required
        />
      </label>
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
        Reserve with bank transfer. Your booking remains pending until the transfer is verified.
        Instructions and a transfer reference will appear on the confirmation screen.
      </p>
      <button
        type="submit"
        className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        disabled={isSubmitting}
        aria-label="Continue to bank transfer instructions"
      >
        {isSubmitting ? "Processing" : "Continue"}
      </button>
    </form>
  );
};
