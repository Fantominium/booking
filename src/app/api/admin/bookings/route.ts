import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const parseDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const allowedStatuses = new Set(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]);

type BookingSummary = {
  id: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  status: string;
  downpaymentPaidCents: number;
  remainingBalanceCents: number;
};

const mapBooking = (
  booking: Prisma.BookingGetPayload<{ include: { service: true } }>,
): BookingSummary => ({
  id: booking.id,
  serviceId: booking.serviceId,
  serviceName: booking.service.name,
  customerName: booking.customerName,
  customerEmail: booking.customerEmail,
  customerPhone: booking.customerPhone,
  startTime: booking.startTime.toISOString(),
  endTime: booking.endTime.toISOString(),
  status: booking.status,
  downpaymentPaidCents: booking.downpaymentPaidCents,
  remainingBalanceCents: booking.remainingBalanceCents,
});

export const GET = async (request: Request): Promise<NextResponse> => {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const searchParam = searchParams.get("search");

  const status = statusParam && allowedStatuses.has(statusParam) ? statusParam : null;
  const startDate = startDateParam ? parseDate(startDateParam) : null;
  const endDate = endDateParam ? parseDate(endDateParam) : null;

  const dateFilter = startDate
    ? {
        gte: startDate,
        lt: endDate ? addDays(endDate, 1) : addDays(startDate, 1),
      }
    : undefined;

  const searchFilters = searchParam
    ? [
        { customerName: { contains: searchParam, mode: "insensitive" as const } },
        { customerPhone: { contains: searchParam } },
      ]
    : null;

  const where: Prisma.BookingWhereInput = {
    ...(status ? { status } : {}),
    ...(dateFilter ? { startTime: dateFilter } : {}),
    ...(searchFilters ? { OR: searchFilters } : {}),
  };

  const bookings = await prisma.booking.findMany({
    where,
    include: { service: true },
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json({ bookings: bookings.map(mapBooking) });
};
