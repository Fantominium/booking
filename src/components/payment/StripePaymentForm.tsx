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
      <p className="text-sm leading-6 text-slate-700">
        Complete your deposit securely by card. Your booking will move into a confirmed state as
        soon as payment succeeds.
      </p>
      <CardElement className="rounded-xl border border-slate-300 bg-white p-4" />
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      <button
        type="submit"
        className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        disabled={isSubmitting}
        aria-label="Submit payment"
      >
        {isSubmitting ? "Processing" : "Pay deposit now"}
      </button>
    </form>
  );
};
