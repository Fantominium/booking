import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const startOfTodayUtc = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const GET = async (): Promise<NextResponse> => {
  const today = startOfTodayUtc();
  const tomorrow = addDays(today, 1);

  const bookings = await prisma.booking.findMany({
    where: {
      startTime: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: { service: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({
    date: today.toISOString().slice(0, 10),
    bookings: bookings.map((booking) => ({
      id: booking.id,
      serviceName: booking.service.name,
      customerName: booking.customerName,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
    })),
  });
};
