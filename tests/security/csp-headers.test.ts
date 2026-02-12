import { describe, expect, it } from "vitest";

const getCspValue = async (): Promise<string | undefined> => {
  const configModule = await import("../../next.config.mjs");
  const config = configModule.default as { headers?: () => Promise<unknown[]> };
  const headers = config.headers ? await config.headers() : [];

  const rootHeaders = headers.find(
    (entry): entry is { source: string; headers: Array<{ key: string; value: string }> } =>
      typeof entry === "object" && entry !== null && "source" in entry,
  );

  return rootHeaders?.headers.find((header) => header.key === "Content-Security-Policy")?.value;
};

describe("security headers", () => {
  it("includes a Content-Security-Policy header", async () => {
    const csp = await getCspValue();
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-src");
  });
});
