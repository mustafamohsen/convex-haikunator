import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    globals: true,
    passWithNoTests: false,
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html", "json"],
      exclude: ["dist/**", "examples/**", "node_modules/**"],
    },
  },
});
