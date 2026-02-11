import { describe, expect, it } from "vitest";

import { jsonError } from "@/lib/api/responses";
import { toSafeError } from "@/lib/errors";

describe("error sanitization", () => {
  it("does not leak sensitive error details", async () => {
    const unsafe = new Error("Sensitive detail: token=secret");
    const safe = toSafeError(unsafe);
    const response = jsonError(safe);
    const body = await response.json();

    expect(JSON.stringify(body)).not.toContain("token=secret");
    expect(body.error.message).toBe("Unexpected error occurred");
  });
});
