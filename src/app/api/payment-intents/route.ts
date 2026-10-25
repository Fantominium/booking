import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const POST = async (): Promise<NextResponse> =>
  NextResponse.json({ error: "Payment intents are unavailable" }, { status: 503 });
