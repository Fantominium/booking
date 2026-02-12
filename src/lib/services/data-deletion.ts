import { addHours, subYears } from "date-fns";
import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";
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

const logDeletion = async (params: {
  email: string;
  reason: "CUSTOMER_REQUEST" | "AUTO_PURGE_AGE" | "GDPR_RIGHT_TO_BE_FORGOTTEN";
  requestedByIp?: string | null;
  status: "SUCCESS" | "FAILED" | "PENDING";
}): Promise<void> => {
  await prisma.dataDeletionAuditLog.create({
    data: {
      originalEmailHash: hashEmail(params.email),
      deletionReason: params.reason,
      requestedByIp: params.requestedByIp ?? null,
      status: params.status,
    },
  });
};

export const anonymizeCustomerData = async (params: {
  email: string;
  reason: "CUSTOMER_REQUEST" | "AUTO_PURGE_AGE" | "GDPR_RIGHT_TO_BE_FORGOTTEN";
  requestedByIp?: string | null;
}): Promise<void> => {
  const emailHash = hashEmail(params.email);

  await prisma.booking.updateMany({
    where: { customerEmail: params.email },
    data: {
      customerName: "Deleted Customer",
      customerEmail: redactEmail(emailHash),
      customerPhone: "REDACTED",
      stripeCustomerId: null,
    },
  });

  await logDeletion({
    email: params.email,
    reason: params.reason,
    requestedByIp: params.requestedByIp,
    status: "SUCCESS",
  });
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

export const purgeOldCustomerData = async (): Promise<number> => {
  const threshold = subYears(new Date(), 2);
  const bookings = await prisma.booking.findMany({
    where: {
      startTime: { lt: threshold },
    },
    select: { customerEmail: true },
  });

  const uniqueEmails = Array.from(
    new Set(bookings.map((booking) => booking.customerEmail).filter(Boolean)),
  ).filter((email) => !email.startsWith("redacted+"));

  await Promise.all(
    uniqueEmails.map((email) =>
      anonymizeCustomerData({
        email,
        reason: "AUTO_PURGE_AGE",
        requestedByIp: null,
      }),
    ),
  );

  return uniqueEmails.length;
};
