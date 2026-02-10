import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const GET = async (
  _request: Request,
  context: { params: { serviceId: string } },
): Promise<NextResponse> => {
  const service = await prisma.service.findUnique({
    where: { id: context.params.serviceId },
  });

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json(service);
};
