"use client";

import type React from "react";
import { useCallback, useState } from "react";

export type CheckoutData = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: "CARD" | "BANK_TRANSFER";
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
      <fieldset className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-950">Payment options</legend>
        {/* TODO: Card deposit payment — coming soon; unhide when Stripe integration is live
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800">
          <input
            id="payment-method-card"
            type="radio"
            name="paymentMethod"
            value="CARD"
            checked={formData.paymentMethod === "CARD"}
            onChange={handleChange}
          />
          <label htmlFor="payment-method-card" className="flex cursor-pointer flex-col gap-1">
            <span className="font-semibold text-slate-950">Pay deposit now by card</span>
            <span>Secure the booking online now and handle any remaining balance later.</span>
          </label>
        </div>
        */}
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800">
          <input
            id="payment-method-bank-transfer"
            type="radio"
            name="paymentMethod"
            value="BANK_TRANSFER"
            checked={formData.paymentMethod === "BANK_TRANSFER"}
            onChange={handleChange}
          />
          <label
            htmlFor="payment-method-bank-transfer"
            className="flex cursor-pointer flex-col gap-1"
          >
            <span className="font-semibold text-slate-950">Reserve with bank transfer</span>
            <span>
              Reserve the booking now and receive the bank details and transfer reference on the
              confirmation screen.
            </span>
          </label>
        </div>
      </fieldset>
      <button
        type="submit"
        className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        disabled={isSubmitting}
        aria-label="Continue to payment"
      >
        {isSubmitting ? "Processing" : "Continue"}
      </button>
    </form>
  );
};
