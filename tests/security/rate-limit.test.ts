import { describe, expect, it } from "vitest";

import { rateLimit } from "@/lib/middleware/rate-limit";

describe("rate limiting", () => {
  it("blocks requests after max threshold", () => {
    const config = { windowMs: 1000, maxRequests: 2 };
    const key = "test-ip";

    const first = rateLimit({ key, config });
    const second = rateLimit({ key, config });
    const third = rateLimit({ key, config });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });
});
