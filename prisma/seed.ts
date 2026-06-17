import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const buildTime = (time: string): Date => new Date(`1970-01-01T${time}:00.000Z`);

const seed = async (): Promise<void> => {
  // Clear all existing services (no bookings in dev/seed environment)
  // Clear dependent records first, then services
  await prisma.paymentAuditLog.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.service.deleteMany({});

  // Studio Rates
  // Swedish Massage – Studio: 60 min $150 Bds, 90 min $180 Bds
  // Deep Tissue Massage – Studio: 60 min $160 Bds, 90 min $190 Bds
  // Sports Massage – Studio: 60 min $180 Bds, 90 min $210 Bds
  // Thai Massage – Studio: 60 min $180 Bds, 90 min $210 Bds
  // Back, Neck & Shoulder Massage – Studio: 45 min $100 Bds
  //
  // Mobile Massage Rates (House Calls)
  // Swedish Massage – Mobile: 60 min $200 Bds, 90 min $230 Bds
  // Deep Tissue Massage – Mobile: 60 min $210 Bds, 90 min $240 Bds
  // Sports Massage – Mobile: 60 min $230 Bds, 90 min $260 Bds
  // Thai Massage – Mobile: 60 min $230 Bds, 90 min $260 Bds
  // Back, Neck & Shoulder Massage – Mobile: 45 min $150 Bds

  await prisma.service.createMany({
    data: [
      // ── Studio Rates ──────────────────────────────────────────
      {
        name: "Swedish Massage – Studio",
        description:
          "Classic relaxation massage using long gliding strokes to improve circulation and reduce muscle tension.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 15000,
        downpaymentCents: 3750,
        durationPriceOptions: [
          { durationMin: 60, priceCents: 15000 },
          { durationMin: 90, priceCents: 18000 },
        ],
      },
      {
        name: "Deep Tissue Massage – Studio",
        description:
          "Focused bodywork targeting deeper muscle layers for intense relief and recovery.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 16000,
        downpaymentCents: 4000,
        durationPriceOptions: [
          { durationMin: 60, priceCents: 16000 },
          { durationMin: 90, priceCents: 19000 },
        ],
      },
      {
        name: "Sports Massage – Studio",
        description:
          "Performance-focused therapy designed to enhance athletic recovery and prevent injuries.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 18000,
        downpaymentCents: 4500,
        durationPriceOptions: [
          { durationMin: 60, priceCents: 18000 },
          { durationMin: 90, priceCents: 21000 },
        ],
      },
      {
        name: "Thai Massage – Studio",
        description:
          "Ancient healing art combining acupressure, energy balancing, and guided stretching for deep restoration.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 18000,
        downpaymentCents: 4500,
        durationPriceOptions: [
          { durationMin: 60, priceCents: 18000 },
          { durationMin: 90, priceCents: 21000 },
        ],
      },
      {
        name: "Back, Neck & Shoulder Massage – Studio",
        description:
          "Targeted relief massage focusing on common tension areas in the back, neck, and shoulders.",
        offeringType: "SESSION",
        durationMin: 45,
        priceCents: 10000,
        downpaymentCents: 2500,
      },
      // ── Mobile Massage Rates (House Calls) ────────────────────
      {
        name: "Swedish Massage – Mobile",
        description:
          "Classic relaxation massage brought to you at home, using long gliding strokes to improve circulation and reduce muscle tension.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 20000,
        downpaymentCents: 5000,
        durationPriceOptions: [
          { durationMin: 60, priceCents: 20000 },
          { durationMin: 90, priceCents: 23000 },
        ],
      },
      {
        name: "Deep Tissue Massage – Mobile",
        description:
          "Focused deep muscle bodywork delivered at your location for intense relief and recovery.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 21000,
        downpaymentCents: 5250,
        durationPriceOptions: [
          { durationMin: 60, priceCents: 21000 },
          { durationMin: 90, priceCents: 24000 },
        ],
      },
      {
        name: "Sports Massage – Mobile",
        description:
          "Performance-focused athletic recovery therapy delivered at your location.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 23000,
        downpaymentCents: 5750,
        durationPriceOptions: [
          { durationMin: 60, priceCents: 23000 },
          { durationMin: 90, priceCents: 26000 },
        ],
      },
      {
        name: "Thai Massage – Mobile",
        description:
          "Ancient acupressure, energy balancing, and guided stretching brought to your home.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 23000,
        downpaymentCents: 5750,
        durationPriceOptions: [
          { durationMin: 60, priceCents: 23000 },
          { durationMin: 90, priceCents: 26000 },
        ],
      },
      {
        name: "Back, Neck & Shoulder Massage – Mobile",
        description:
          "Targeted relief massage focusing on common tension areas, delivered at your location.",
        offeringType: "SESSION",
        durationMin: 45,
        priceCents: 15000,
        downpaymentCents: 3750,
      },
    ],
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
