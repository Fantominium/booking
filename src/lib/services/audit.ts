import { prisma } from "@/lib/prisma";

export type AuditInput = {
  bookingId: string;
  action:
    | "INTENT_CREATED"
    | "PAYMENT_CONFIRMED"
    | "PAYMENT_FAILED"
    | "REFUND_ISSUED"
    | "REFUND_FAILED";
  amountCents: number;
  outcome: "SUCCESS" | "FAILED" | "PENDING";
  stripeEventId?: string | null;
  stripePaymentIntentId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  errorMessage?: string | null;
};

export const logPaymentAudit = async (input: AuditInput): Promise<void> => {
  await prisma.paymentAuditLog.create({
    data: {
      bookingId: input.bookingId,
      action: input.action,
      amountCents: input.amountCents,
      outcome: input.outcome,
      stripeEventId: input.stripeEventId ?? null,
      stripePaymentIntentId: input.stripePaymentIntentId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      errorMessage: input.errorMessage ?? null,
    },
  });
};

export const hasPaymentAuditEvent = async (params: {
  stripeEventId: string;
  action: AuditInput["action"];
}): Promise<boolean> => {
  const existing = await prisma.paymentAuditLog.findFirst({
    where: {
      stripeEventId: params.stripeEventId,
      action: params.action,
    },
  });

  return Boolean(existing);
};
