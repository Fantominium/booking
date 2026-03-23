import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = async (): Promise<NextResponse> => {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ offeringType: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(services);
};
