import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const buildTime = (time: string): Date => new Date(`1970-01-01T${time}:00.000Z`);

const seed = async (): Promise<void> => {
  await prisma.service.createMany({
    data: [
      // Popular Massage Therapies (Top 8)
      {
        name: "Swedish Massage",
        description:
          "Classic relaxation massage using long gliding strokes to improve circulation and reduce muscle tension.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 7500,
        downpaymentCents: 1875,
        heroMediaType: "IMAGE",
        heroMediaUrl: "/uploads/service-media/demo-swedish-hero.jpg",
        heroMediaAltText: "A tranquil massage room with folded towels and candles.",
        cardMediaType: "IMAGE",
        cardMediaUrl: "/uploads/service-media/demo-swedish-card.jpg",
        cardMediaAltText: "Hands performing a Swedish massage technique.",
      },
      {
        name: "Deep Tissue Massage",
        description:
          "Focused bodywork session targeting deeper muscle layers for intense relief and recovery.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 8500,
        downpaymentCents: 2125,
        heroMediaType: "VIDEO",
        heroMediaUrl: "/uploads/service-media/demo-deep-tissue-hero.mp4",
        heroPosterUrl: "/uploads/service-media/demo-deep-tissue-poster.jpg",
        heroMediaAltText: "Therapist applying deep pressure massage on a client's back.",
        cardMediaType: "GIF",
        cardMediaUrl: "/uploads/service-media/demo-deep-tissue-card.gif",
        cardMediaAltText: "Animated close-up of deep tissue massage movement.",
      },
      {
        name: "Hot Stone Massage",
        description:
          "Therapeutic massage using heated stones to relieve tension, improve circulation, and promote relaxation.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 9500,
        downpaymentCents: 2375,
      },
      {
        name: "Thai Massage",
        description:
          "Ancient healing art combining acupressure, energy balancing, and guided stretching for deep restoration.",
        offeringType: "SESSION",
        durationMin: 90,
        priceCents: 10000,
        downpaymentCents: 2500,
      },
      {
        name: "Reflexology",
        description:
          "Specialized foot therapy stimulating pressure points to enhance wellness and promote natural healing.",
        offeringType: "SESSION",
        durationMin: 45,
        priceCents: 6000,
        downpaymentCents: 1500,
      },
      {
        name: "Sports Massage",
        description:
          "Performance-focused therapy designed to enhance athletic recovery and prevent injuries.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 8000,
        downpaymentCents: 2000,
      },
      {
        name: "Prenatal Massage",
        description:
          "Gentle, specialized massage designed for pregnancy comfort and relief of tension and discomfort.",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 8000,
        downpaymentCents: 2000,
      },
      {
        name: "Aromatherapy Relaxation Massage",
        description:
          "Soothing massage infused with essential oils to promote deep relaxation and emotional wellness.",
        offeringType: "SESSION",
        durationMin: 50,
        priceCents: 7000,
        downpaymentCents: 1750,
      },
      // Additional group and rental options
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
