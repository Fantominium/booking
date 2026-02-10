import { NextResponse } from "next/server";

import { createPaymentIntentRequestSchema } from "@/lib/schemas/api";
import { createPaymentIntent } from "@/lib/services/payment";

export const POST = async (request: Request): Promise<NextResponse> => {
  const body = await request.json();
  const parsed = createPaymentIntentRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const intent = await createPaymentIntent({
    amountCents: parsed.data.amountCents,
    currency: parsed.data.currency,
  });

  return NextResponse.json(intent, { status: 201 });
};
