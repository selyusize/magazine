import { defineConfig } from "orval";

import camelCaseSpec from "./orval.transformer";

export default defineConfig({
  api: {
    input: {
      // Store API Medusa + свои роуты из JSDoc @oas (генерируется в backend: `pnpm openapi:generate`)
      target: process.env.OPENAPI_SCHEMA ?? "../backend/openapi/store.oas.json",
      override: {
        // snake_case бэкенда → camelCase во всех типах (данные преобразует http.ts тем же правилом)
        transformer: camelCaseSpec,
      },
    },
    output: {
      mode: "tags-split",
      target: "src/shared/api/generated/endpoints",
      schemas: "src/shared/api/generated/schemas",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      indexFiles: true,
      override: {
        mutator: {
          path: "src/shared/api/http.ts",
          name: "http",
        },
        fetch: {
          // Функции возвращают сразу тело ответа, а не { data, status, headers }
          includeHttpResponseReturnType: false,
        },
        query: {
          version: 5,
          useSuspenseQuery: true,
          usePrefetch: true,
          useInvalidate: true,
          shouldExportKeys: true,
          signal: true,
        },
      },
    },
  },
});
