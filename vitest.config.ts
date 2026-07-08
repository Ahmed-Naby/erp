import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    // DATABASE_URL is inherited from the environment — a throwaway Postgres
    // database (a local instance or the CI service container). The schema is
    // Postgres, so tests require a real Postgres, not the old SQLite file.
    testTimeout: 15000,
    include: ["src/**/*.test.ts"],
    // Tests share one database, so run files sequentially to avoid cross-file
    // data races within a single run.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
