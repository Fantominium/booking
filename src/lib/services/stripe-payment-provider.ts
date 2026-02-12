import { stripe } from "@/lib/stripe/config";
import type { PaymentProvider } from "@/lib/services/payment-provider.interface";

export const createStripePaymentProvider = (): PaymentProvider => {
  return {
    createPaymentIntent: async (amountCents, currency) => {
      const intent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency,
      });
      return { id: intent.id, clientSecret: intent.client_secret };
    },
    confirmPayment: async (paymentIntentId) => {
      const intent = await stripe.paymentIntents.confirm(paymentIntentId);
      return intent.status ?? "unknown";
    },
    handleWebhook: async () => {
      return "handled";
    },
    refund: async (paymentIntentId, amountCents) => {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amountCents,
      });
      return refund.id;
    },
  };
};
