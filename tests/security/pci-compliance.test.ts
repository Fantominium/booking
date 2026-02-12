import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("pci compliance", () => {
  it("does not store raw card data in the schema", () => {
    const schemaPath = resolve(__dirname, "../../prisma/schema.prisma");
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).not.toMatch(/card_number|cardNumber|cvv|cvc|pan/i);
  });
});
