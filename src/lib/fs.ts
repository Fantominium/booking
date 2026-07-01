// Thin re-export of node:fs/promises functions used by the application.
// Isolating this import in a user-land module makes it straightforward to mock
// in tests without hitting vitest's limitations with node: protocol modules.
export { mkdir, writeFile } from "node:fs/promises";
