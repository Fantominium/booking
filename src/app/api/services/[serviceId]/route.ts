import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const GET = async (
  _request: Request,
  context: { params: Promise<{ serviceId: string }> },
): Promise<NextResponse> => {
  const { serviceId } = await context.params;

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json(service);
};
