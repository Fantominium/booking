/* eslint-disable security/detect-non-literal-fs-filename */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const readAllFiles = (dir: string): string[] => {
  const entries = readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return readAllFiles(fullPath);
    }
    return [fullPath];
  });
};

describe("sql injection prevention", () => {
  it("does not use unsafe raw queries", () => {
    const srcDir = join(__dirname, "../../src");
    const files = readAllFiles(srcDir).filter((file) => file.endsWith(".ts"));
    const contents = files.map((file) => readFileSync(file, "utf8")).join("\n");

    expect(contents).not.toContain("$queryRawUnsafe");
  });
});
