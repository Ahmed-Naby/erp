import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    env: { DATABASE_URL: "file:./test.db" },
    testTimeout: 15000,
    include: ["src/**/*.test.ts"],
    // Single SQLite file DB: parallel test files would contend on the same
    // file lock, so run files sequentially in one process.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
