import { hasPaymentAuditEvent, logPaymentAudit } from "@/lib/services/audit";
import { createStripePaymentProvider } from "@/lib/services/stripe-payment-provider";

export type PaymentIntentResult = {
  id: string;
  clientSecret: string | null;
};

const provider = createStripePaymentProvider();

export const createPaymentIntent = async (params: {
  bookingId?: string;
  amountCents: number;
  currency: string;
}): Promise<PaymentIntentResult> => {
  const intent = await provider.createPaymentIntent(params.amountCents, params.currency);

  if (params.bookingId) {
    await logPaymentAudit({
      bookingId: params.bookingId,
      action: "INTENT_CREATED",
      amountCents: params.amountCents,
      outcome: "SUCCESS",
      stripePaymentIntentId: intent.id,
    });
  }

  return intent;
};

export const refundPaymentIntent = async (params: {
  bookingId: string;
  paymentIntentId: string;
  amountCents?: number;
}): Promise<string> => {
  try {
    const refundId = await provider.refund(params.paymentIntentId, params.amountCents);

    await logPaymentAudit({
      bookingId: params.bookingId,
      action: "REFUND_ISSUED",
      amountCents: params.amountCents ?? 0,
      outcome: "SUCCESS",
      stripePaymentIntentId: params.paymentIntentId,
    });

    return refundId;
  } catch (error) {
    await logPaymentAudit({
      bookingId: params.bookingId,
      action: "REFUND_FAILED",
      amountCents: params.amountCents ?? 0,
      outcome: "FAILED",
      stripePaymentIntentId: params.paymentIntentId,
      errorMessage: error instanceof Error ? error.message : "Refund failed",
    });
    throw error;
  }
};

export const refundOnConflict = async (params: {
  bookingId: string;
  paymentIntentId: string;
  amountCents: number;
}): Promise<string> => {
  return refundPaymentIntent({
    bookingId: params.bookingId,
    paymentIntentId: params.paymentIntentId,
    amountCents: params.amountCents,
  });
};

export const isWebhookEventProcessed = async (params: {
  stripeEventId: string;
  action: "PAYMENT_CONFIRMED" | "PAYMENT_FAILED";
}): Promise<boolean> => {
  return hasPaymentAuditEvent({
    stripeEventId: params.stripeEventId,
    action: params.action,
  });
};
