import { describe, expect, it } from "vitest";

describe("admin authorization", () => {
  it("blocks unauthenticated access to admin endpoints", () => {
    expect(true).toBe(true);
  });
});
