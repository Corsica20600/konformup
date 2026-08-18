import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  esbuild: {
    jsx: "automatic"
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "server-only": path.resolve(__dirname, "lib/test/server-only.ts")
    }
  },
  test: {
    environment: "node",
    passWithNoTests: true
  }
});
