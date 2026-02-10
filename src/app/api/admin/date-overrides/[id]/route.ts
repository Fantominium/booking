import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: {
    id: string;
  };
};

export const DELETE = async (_request: Request, { params }: RouteParams): Promise<NextResponse> => {
  await prisma.dateOverride.delete({
    where: { id: params.id },
  });

  return new NextResponse(null, { status: 204 });
};
