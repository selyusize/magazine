import { defineConfig } from "eslint/config"
import medusa from "@medusajs/eslint-plugin"
import tseslint from "typescript-eslint"

export default defineConfig([
  ...medusa.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      // Приведения типов (`as`, `<T>x`) запрещены: неизвестное сужается схемой zod или проверкой (arch-guide, п.12).
      // `as const` правилом не считается
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
    },
  },
])
