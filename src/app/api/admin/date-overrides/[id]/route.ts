import { NextResponse } from "next/server";

import { invalidateAvailabilityCache } from "@/lib/cache/availability";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const DELETE = async (_request: Request, { params }: RouteParams): Promise<NextResponse> => {
  const { id } = await params;

  await prisma.dateOverride.delete({
    where: { id },
  });

  invalidateAvailabilityCache();

  return new NextResponse(null, { status: 204 });
};
