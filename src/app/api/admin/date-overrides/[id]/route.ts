import { NextResponse } from "next/server";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import { invalidateAvailabilityCache } from "@/lib/cache/availability";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const DELETE = async (_request: Request, { params }: RouteParams): Promise<NextResponse> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse();
  }

  const { id } = await params;

  await prisma.dateOverride.delete({
    where: { id },
  });

  invalidateAvailabilityCache();

  return new NextResponse(null, { status: 204 });
};
