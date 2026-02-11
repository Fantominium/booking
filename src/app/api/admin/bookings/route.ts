import { NextResponse } from "next/server";
import { z } from "zod";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCached, setCached, CACHE_TTL } from "@/lib/cache/redis";
import { type BookingStatus } from "@/types/booking";

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

// Query parameters validation schema
const querySchema = z.object({
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform((val) => Math.max(1, parseInt(val) || 1)),
  limit: z.string().transform((val) => Math.min(100, Math.max(10, parseInt(val) || 20))),
  sort: z
    .enum(["startTime", "customerName", "status", "createdAt"])
    .optional()
    .default("startTime"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

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
  emailDeliveryStatus: string;
  downpaymentPaidCents: number;
  remainingBalanceCents: number;
  createdAt: string;
};

type PaginatedResponse = {
  bookings: BookingSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

type ErrorResponse = {
  error: string;
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
  emailDeliveryStatus: booking.emailDeliveryStatus,
  downpaymentPaidCents: booking.downpaymentPaidCents,
  remainingBalanceCents: booking.remainingBalanceCents,
  createdAt: booking.createdAt.toISOString(),
});

export const GET = async (
  request: Request,
): Promise<NextResponse<PaginatedResponse | ErrorResponse>> => {
  const { searchParams } = new URL(request.url);

  // Validate and parse query parameters
  const queryResult = querySchema.safeParse({
    status: searchParams.get("status") || undefined,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    search: searchParams.get("search") || undefined,
    page: searchParams.get("page") || "1",
    limit: searchParams.get("limit") || "20",
    sort: searchParams.get("sort") || undefined,
    order: searchParams.get("order") || undefined,
  });

  if (!queryResult.success) {
    return NextResponse.json<ErrorResponse>({ error: "Invalid query parameters" }, { status: 400 });
  }

  const { status, startDate, endDate, search, page, limit, sort, order } = queryResult.data;

  // Build cache key for this request
  const cacheKey = `bookings:admin:${JSON.stringify({
    status,
    startDate,
    endDate,
    search,
    page,
    limit,
    sort,
    order,
  })}`;

  // Try to get from cache first
  const cached = await getCached<PaginatedResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Validate status parameter
  const validStatus: BookingStatus | null =
    status && allowedStatuses.has(status) ? (status as BookingStatus) : null;
  const parsedStartDate = startDate ? parseDate(startDate) : null;
  const parsedEndDate = endDate ? parseDate(endDate) : null;

  // Build date filter
  const dateFilter = parsedStartDate
    ? {
        gte: parsedStartDate,
        lt: parsedEndDate ? addDays(parsedEndDate, 1) : addDays(parsedStartDate, 1),
      }
    : undefined;

  // Build search filters
  const searchFilters = search
    ? [
        { customerName: { contains: search, mode: "insensitive" as const } },
        { customerPhone: { contains: search } },
        { customerEmail: { contains: search, mode: "insensitive" as const } },
        { service: { name: { contains: search, mode: "insensitive" as const } } },
      ]
    : null;

  // Build where clause
  const where: Prisma.BookingWhereInput = {
    ...(validStatus ? { status: validStatus } : {}),
    ...(dateFilter ? { startTime: dateFilter } : {}),
    ...(searchFilters ? { OR: searchFilters } : {}),
  };

  // Build order by clause
  const orderBy: Prisma.BookingOrderByWithRelationInput =
    sort === "customerName"
      ? { customerName: order }
      : sort === "status"
        ? { status: order }
        : sort === "createdAt"
          ? { createdAt: order }
          : { startTime: order };

  // Calculate pagination
  const skip = (page - 1) * limit;

  try {
    // Execute queries in parallel
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { service: true },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse = {
      bookings: bookings.map(mapBooking),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    // Cache the response (shorter TTL for dynamic data)
    await setCached(cacheKey, response, CACHE_TTL.BOOKING_CONFLICTS);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json<ErrorResponse>({ error: "Internal server error" }, { status: 500 });
  }
};
