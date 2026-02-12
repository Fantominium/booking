import { prisma } from "@/lib/prisma";

export const resetDatabase = async (): Promise<void> => {
  await prisma.$transaction([
    prisma.paymentAuditLog.deleteMany(),
    prisma.dataDeletionAuditLog.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.service.deleteMany(),
    prisma.businessHours.deleteMany(),
    prisma.dateOverride.deleteMany(),
    prisma.systemSettings.deleteMany(),
    prisma.admin.deleteMany(),
  ]);
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};
