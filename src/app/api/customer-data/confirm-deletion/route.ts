import { NextResponse } from "next/server";

import { confirmDeletionRequest } from "@/lib/services/data-deletion";
import { customerDataDeletionConfirmSchema } from "@/lib/schemas/api";
import { isAppError, toSafeError } from "@/lib/errors";
import { jsonError } from "@/lib/api/responses";
import { publicRateLimitResponse } from "@/lib/middleware/rate-limit";

export const POST = async (request: Request): Promise<NextResponse> => {
  try {
    const rateLimitResponse = await publicRateLimitResponse({
      request,
      namespace: "customer-deletion-confirm",
      maxRequests: 5,
      windowSeconds: 60 * 60,
    });
    if (rateLimitResponse) {
      return rateLimitResponse as NextResponse;
    }

    const body = await request.json();
    const parsed = customerDataDeletionConfirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    await confirmDeletionRequest(parsed.data.token);

    return NextResponse.json({ message: "Deletion processed" });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Invalid token" || error.message === "Token expired")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (isAppError(error)) {
      return jsonError(error);
    }

    return jsonError(toSafeError(error));
  }
};
