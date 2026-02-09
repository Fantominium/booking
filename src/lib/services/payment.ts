import { stripe } from "@/lib/stripe/config";

export type PaymentIntentResult = {
  id: string;
  clientSecret: string | null;
};

export const createPaymentIntent = async (params: {
  amountCents: number;
  currency: string;
  metadata?: Record<string, string>;
}): Promise<PaymentIntentResult> => {
  const intent = await stripe.paymentIntents.create({
    amount: params.amountCents,
    currency: params.currency,
    metadata: params.metadata,
  });

  return { id: intent.id, clientSecret: intent.client_secret };
};

export const refundPaymentIntent = async (params: {
  paymentIntentId: string;
  amountCents?: number;
}): Promise<string> => {
  const refund = await stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    amount: params.amountCents,
  });

  return refund.id;
};
