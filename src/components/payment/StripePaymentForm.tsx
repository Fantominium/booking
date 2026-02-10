"use client";

import type React from "react";
import { useCallback, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";

export type StripePaymentFormProps = {
  clientSecret: string;
  onPaymentComplete: () => void;
};

export const StripePaymentForm = ({
  clientSecret,
  onPaymentComplete,
}: StripePaymentFormProps): JSX.Element => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!stripe || !elements) {
        return;
      }
      setIsSubmitting(true);
      setErrorMessage(null);

      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        setErrorMessage("Card element not found");
        setIsSubmitting(false);
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "Payment failed");
        setIsSubmitting(false);
        return;
      }

      onPaymentComplete();
      setIsSubmitting(false);
    },
    [clientSecret, elements, onPaymentComplete, stripe],
  );

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <CardElement className="rounded-md border border-slate-300 p-3" />
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        disabled={isSubmitting}
        aria-label="Submit payment"
      >
        {isSubmitting ? "Processing" : "Pay now"}
      </button>
    </form>
  );
};
