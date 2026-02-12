import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const buildTime = (time: string): Date => new Date(`1970-01-01T${time}:00.000Z`);

const seed = async (): Promise<void> => {
  await prisma.service.createMany({
    data: [
      {
        name: "Deep Tissue Massage",
        description: "Deep tissue massage with focused pressure.",
        durationMin: 60,
        priceCents: 8000,
        downpaymentCents: 2000,
      },
      {
        name: "Swedish Massage",
        description: "Relaxing full-body Swedish massage.",
        durationMin: 45,
        priceCents: 6000,
        downpaymentCents: 1500,
      },
      {
        name: "Hot Stone Massage",
        description: "Warm stones for deep relaxation.",
        durationMin: 75,
        priceCents: 12000,
        downpaymentCents: 3000,
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
    update: { maxBookingsPerDay: 8, bufferMinutes: 15 },
    create: {
      id: "settings-default",
      maxBookingsPerDay: 8,
      bufferMinutes: 15,
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
