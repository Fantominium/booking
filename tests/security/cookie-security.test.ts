import { describe, expect, it } from "vitest";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";

describe("cookie security", () => {
  it("enforces HttpOnly and SameSite=Strict for session cookies", () => {
    const options = authOptions.cookies?.sessionToken?.options;

    expect(options?.httpOnly).toBe(true);
    expect(options?.sameSite).toBe("strict");
    expect(options?.secure).toBe(process.env.NODE_ENV === "production");
  });
});
