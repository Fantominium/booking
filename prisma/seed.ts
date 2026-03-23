import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const buildTime = (time: string): Date => new Date(`1970-01-01T${time}:00.000Z`);

const seed = async (): Promise<void> => {
  await prisma.service.createMany({
    data: [
      {
        name: "Deep Tissue Session",
        description: "Focused bodywork session for deep muscular relief.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 8000,
        downpaymentCents: 2000,
      },
      {
        name: "Wellness Circle Event",
        description: "Small-group guided recovery event for teams and communities.",
        offeringType: "EVENT",
        durationMin: 90,
        priceCents: 18000,
        downpaymentCents: 4500,
      },
      {
        name: "Recovery Studio Rental",
        description: "Private space rental for guided recovery, breathwork, or self-led sessions.",
        offeringType: "RENTAL",
        durationMin: 120,
        priceCents: 14000,
        downpaymentCents: 3500,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.businessHours.createMany({
    data: [
      {
        dayOfWeek: 0,
        openingTime: buildTime("09:00"),
        closingTime: buildTime("17:00"),
        isOpen: true,
      },
      {
        dayOfWeek: 1,
        openingTime: buildTime("09:00"),
        closingTime: buildTime("17:00"),
        isOpen: true,
      },
      {
        dayOfWeek: 2,
        openingTime: buildTime("09:00"),
        closingTime: buildTime("17:00"),
        isOpen: true,
      },
      {
        dayOfWeek: 3,
        openingTime: buildTime("09:00"),
        closingTime: buildTime("17:00"),
        isOpen: true,
      },
      {
        dayOfWeek: 4,
        openingTime: buildTime("09:00"),
        closingTime: buildTime("17:00"),
        isOpen: true,
      },
      { dayOfWeek: 5, openingTime: null, closingTime: null, isOpen: false },
      { dayOfWeek: 6, openingTime: null, closingTime: null, isOpen: false },
    ],
    skipDuplicates: true,
  });

  await prisma.systemSettings.upsert({
    where: { id: "settings-default" },
    update: {
      maxBookingsPerDay: 8,
      bufferMinutes: 15,
      bankTransferInstructions:
        "Bank transfer available. Account name: TruFlow Wellness. Sort code: 12-34-56. Account number: 12345678. Use your booking reference in the payment memo.",
    },
    create: {
      id: "settings-default",
      maxBookingsPerDay: 8,
      bufferMinutes: 15,
      bankTransferInstructions:
        "Bank transfer available. Account name: TruFlow Wellness. Sort code: 12-34-56. Account number: 12345678. Use your booking reference in the payment memo.",
    },
  });

  const adminPasswordHash = await bcrypt.hash("TestPassword123!", 12);

  await prisma.admin.upsert({
    where: { email: "admin@truflow.local" },
    update: {},
    create: {
      email: "admin@truflow.local",
      passwordHash: adminPasswordHash,
    },
  });
};

void (async () => {
  try {
    await seed();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
