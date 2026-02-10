"use client";

import type React from "react";
import { useCallback, useState } from "react";

export type CheckoutData = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
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
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        <span>Full name</span>
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          name="customerName"
          value={formData.customerName}
          onChange={handleChange}
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        <span>Email</span>
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
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
          className="rounded-md border border-slate-300 px-3 py-2"
          name="customerPhone"
          value={formData.customerPhone}
          onChange={handleChange}
          required
        />
      </label>
      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        disabled={isSubmitting}
        aria-label="Continue to payment"
      >
        {isSubmitting ? "Processing" : "Continue to payment"}
      </button>
    </form>
  );
};
