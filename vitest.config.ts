import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      name: "react-plugin",
      config: () => ({
        esbuild: {
          jsx: "automatic",
        },
      }),
    },
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
