import { NextResponse } from "next/server";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = async (): Promise<NextResponse> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse();
  }

  const unpaidBalances = await prisma.booking.findMany({
    where: {
      OR: [
        {
          status: "CONFIRMED",
          remainingBalanceCents: { gt: 0 },
        },
        {
          paymentState: "PENDING_BANK_TRANSFER",
        },
      ],
    },
    include: { service: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({
    unpaidBalances: unpaidBalances.map((booking: (typeof unpaidBalances)[number]) => ({
      id: booking.id,
      serviceName: booking.service.name,
      customerName: booking.customerName,
      startTime: booking.startTime.toISOString(),
      remainingBalanceCents: booking.remainingBalanceCents,
    })),
    emailFailures: [],
  });
};
