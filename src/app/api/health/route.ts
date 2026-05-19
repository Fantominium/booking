import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { redisConnection } from "@/lib/queue/config";

export const dynamic = "force-dynamic";

const checkDatabase = async (): Promise<"ok" | "error"> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
};

const checkRedis = async (): Promise<"ok" | "error"> => {
  try {
    const result = await redisConnection.ping();
    return result === "PONG" ? "ok" : "error";
  } catch {
    return "error";
  }
};

export async function GET(): Promise<NextResponse> {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  const status = database === "ok" && redis === "ok" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      checks: {
        database,
        redis,
      },
    },
    {
      status: status === "ok" ? 200 : 503,
    },
  );
}
