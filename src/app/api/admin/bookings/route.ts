import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";
import { getCached, setCached, CACHE_TTL } from "@/lib/cache/redis";
import { type BookingStatus } from "@/types/booking";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

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
const parseNumberParam = (value: string, fallback: number, min: number, max: number): number => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
};

const getOrderBy = (
  sort: "startTime" | "customerName" | "status" | "createdAt",
  order: "asc" | "desc",
): Prisma.BookingOrderByWithRelationInput => {
  if (sort === "customerName") {
    return { customerName: order };
  }

  if (sort === "status") {
    return { status: order };
  }

  if (sort === "createdAt") {
    return { createdAt: order };
  }

  return { startTime: order };
};

const buildCacheKey = (params: {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page: number;
  limit: number;
  sort: string;
  order: string;
}): string => {
  return `bookings:admin:${JSON.stringify(params)}`;
};

const buildDateFilter = (startDate?: string, endDate?: string): Prisma.DateTimeFilter | undefined => {
  if (!startDate) {
    return undefined;
  }

  const parsedStartDate = parseDate(startDate);
  const parsedEndDate = endDate ? parseDate(endDate) : null;

  return {
    gte: parsedStartDate,
    lt: parsedEndDate ? addDays(parsedEndDate, 1) : addDays(parsedStartDate, 1),
  };
};

const buildSearchFilters = (search?: string): Prisma.BookingWhereInput["OR"] | undefined => {
  if (!search) {
    return undefined;
  }

  return [
    { customerName: { contains: search, mode: "insensitive" as const } },
    { customerPhone: { contains: search } },
    { customerEmail: { contains: search, mode: "insensitive" as const } },
    { service: { name: { contains: search, mode: "insensitive" as const } } },
  ];
};

const buildWhereClause = (params: {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}): Prisma.BookingWhereInput => {
  const validStatus =
    params.status && allowedStatuses.has(params.status)
      ? (params.status as BookingStatus)
      : null;
  const dateFilter = buildDateFilter(params.startDate, params.endDate);
  const searchFilters = buildSearchFilters(params.search);

  return {
    ...(validStatus ? { status: validStatus } : {}),
    ...(dateFilter ? { startTime: dateFilter } : {}),
    ...(searchFilters ? { OR: searchFilters } : {}),
  };
};

// Query parameters validation schema
const querySchema = z.object({
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform((value) => parseNumberParam(value, 1, 1, Number.MAX_SAFE_INTEGER)),
  limit: z.string().transform((value) => parseNumberParam(value, 20, 10, 100)),
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
  paymentMethod: string;
  paymentState: string;
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

type BookingWithService = {
  id: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: Date;
  endTime: Date;
  status: string;
  paymentMethod: string;
  paymentState: string;
  emailDeliveryStatus: string;
  downpaymentPaidCents: number;
  remainingBalanceCents: number;
  createdAt: Date;
  service: {
    name: string;
  };
};

const mapBooking = (booking: BookingWithService): BookingSummary => ({
  id: booking.id,
  serviceId: booking.serviceId,
  serviceName: booking.service.name,
  customerName: booking.customerName,
  customerEmail: booking.customerEmail,
  customerPhone: booking.customerPhone,
  startTime: booking.startTime.toISOString(),
  endTime: booking.endTime.toISOString(),
  status: booking.status,
  paymentMethod: booking.paymentMethod,
  paymentState: booking.paymentState,
  emailDeliveryStatus: booking.emailDeliveryStatus,
  downpaymentPaidCents: booking.downpaymentPaidCents,
  remainingBalanceCents: booking.remainingBalanceCents,
  createdAt: booking.createdAt.toISOString(),
});

export const GET = async (
  request: Request,
): Promise<NextResponse<PaginatedResponse | ErrorResponse>> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse() as NextResponse<PaginatedResponse | ErrorResponse>;
  }

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

  const cacheKey = buildCacheKey({
    status,
    startDate,
    endDate,
    search,
    page,
    limit,
    sort,
    order,
  });

  // Try to get from cache first
  const cached = await getCached<PaginatedResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const where = buildWhereClause({ status, startDate, endDate, search });
  const orderBy = getOrderBy(sort, order);

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
