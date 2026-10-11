import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // server-only はテスト環境では何もしないモジュールに差し替える
      "server-only": path.resolve(import.meta.dirname, "src/test/empty-module.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
