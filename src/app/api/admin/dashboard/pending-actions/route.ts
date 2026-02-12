import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const GET = async (): Promise<NextResponse> => {
  const unpaidBalances = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      remainingBalanceCents: { gt: 0 },
    },
    include: { service: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({
    unpaidBalances: unpaidBalances.map((booking) => ({
      id: booking.id,
      serviceName: booking.service.name,
      customerName: booking.customerName,
      startTime: booking.startTime.toISOString(),
      remainingBalanceCents: booking.remainingBalanceCents,
    })),
    emailFailures: [],
  });
};
