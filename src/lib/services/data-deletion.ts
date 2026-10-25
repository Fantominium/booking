import { addHours, subMonths } from "date-fns";
import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";
import { emitAlert } from "@/lib/ops/alerts";
import { resend } from "@/lib/email/config";
import { DeletionRequestEmail } from "@/lib/email/templates/deletion-request";

const hashEmail = (email: string): string => {
  return createHash("sha256").update(email.toLowerCase()).digest("hex");
};

const redactEmail = (hash: string): string => {
  return `redacted+${hash.slice(0, 12)}@truflow.local`;
};

export const createDeletionRequest = async (params: {
  email: string;
  requestedByIp?: string | null;
}): Promise<string> => {
  const token = randomBytes(32).toString("hex");
  const expiresAt = addHours(new Date(), 1);

  await prisma.dataDeletionRequest.create({
    data: {
      email: params.email,
      token,
      expiresAt,
      requestedByIp: params.requestedByIp ?? null,
    },
  });

  await resend.emails.send({
    from: "TruFlow <privacy@truflow.local>",
    to: params.email,
    subject: "Confirm your data deletion request",
    react: DeletionRequestEmail({ token }),
  });

  return token;
};

export const anonymizeCustomerData = async (params: {
  email: string;
  reason: "CUSTOMER_REQUEST" | "AUTO_PURGE_AGE" | "GDPR_RIGHT_TO_BE_FORGOTTEN";
  requestedByIp?: string | null;
  // Age-based purges must leave a returning customer's recent or upcoming bookings intact.
  endedBefore?: Date;
}): Promise<void> => {
  const emailHash = hashEmail(params.email);

  // One transaction per customer: the redaction and its audit record commit together or not at all.
  await prisma.$transaction([
    prisma.booking.updateMany({
      where: {
        customerEmail: params.email,
        ...(params.endedBefore ? { endTime: { lt: params.endedBefore } } : {}),
      },
      data: {
        customerName: "Deleted Customer",
        customerEmail: redactEmail(emailHash),
        customerPhone: "REDACTED",
        stripeCustomerId: null,
      },
    }),
    prisma.dataDeletionAuditLog.create({
      data: {
        originalEmailHash: emailHash,
        deletionReason: params.reason,
        requestedByIp: params.requestedByIp ?? null,
        status: "SUCCESS",
      },
    }),
  ]);
};

export const confirmDeletionRequest = async (token: string): Promise<void> => {
  const request = await prisma.dataDeletionRequest.findUnique({
    where: { token },
  });

  if (!request) {
    throw new Error("Invalid token");
  }

  if (request.confirmedAt) {
    return;
  }

  if (request.expiresAt < new Date()) {
    throw new Error("Token expired");
  }

  await anonymizeCustomerData({
    email: request.email,
    reason: "CUSTOMER_REQUEST",
    requestedByIp: request.requestedByIp,
  });

  await prisma.dataDeletionRequest.update({
    where: { id: request.id },
    data: { confirmedAt: new Date() },
  });
};

export const purgeOldCustomerData = async (now: Date = new Date()): Promise<number> => {
  // Legal hold suspends all age-based anonymization (D9a).
  if (process.env.PII_PURGE_LEGAL_HOLD === "true") {
    return 0;
  }

  const threshold = subMonths(now, 24);
  const bookings = await prisma.booking.findMany({
    where: { endTime: { lt: threshold } },
    select: { customerEmail: true },
    distinct: ["customerEmail"],
  });

  const emails = bookings
    .map((booking: (typeof bookings)[number]) => booking.customerEmail)
    .filter(
      (email: string | null): email is string => Boolean(email) && !email?.startsWith("redacted+"),
    );

  let anonymized = 0;
  let failed = 0;
  for (const email of emails) {
    try {
      await anonymizeCustomerData({
        email,
        reason: "AUTO_PURGE_AGE",
        requestedByIp: null,
        endedBefore: threshold,
      });
      anonymized += 1;
    } catch {
      failed += 1;
    }
  }

  if (failed > 0) {
    await emitAlert("pii_purge_failed", { job: "privacy-maintenance", failed, anonymized });
    throw new Error(`PII purge failed for ${failed} customer(s)`);
  }

  return anonymized;
};
