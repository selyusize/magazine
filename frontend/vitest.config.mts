import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Те же переменные, что у `next dev`: адрес Medusa и publishable key. Уже заданные в окружении не перезаписываются
for (const file of [".env.test.local", ".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const stub = (file: string) => fileURLToPath(new URL(`./tests/stubs/${file}`, import.meta.url));

export default defineConfig({
  resolve: {
    // Алиасы @app, @shared, @api… из tsconfig.json
    tsconfigPaths: true,
    // `server-only` падает вне сборки Next — в тестах это пустой модуль
    alias: { "server-only": stub("server-only.ts") },
  },
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["tests/integration/global-setup.ts"],
          setupFiles: ["tests/integration/setup.ts"],
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
