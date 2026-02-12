import { NextResponse } from "next/server";

import { createDeletionRequest } from "@/lib/services/data-deletion";
import { customerDataDeletionRequestSchema } from "@/lib/schemas/api";
import { isAppError, toSafeError } from "@/lib/errors";
import { jsonError } from "@/lib/api/responses";

export const POST = async (request: Request): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const parsed = customerDataDeletionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");

    await createDeletionRequest({
      email: parsed.data.email,
      requestedByIp: ip,
    });

    return NextResponse.json({ message: "Verification email sent" });
  } catch (error) {
    if (isAppError(error)) {
      return jsonError(error);
    }

    return jsonError(toSafeError(error));
  }
};
