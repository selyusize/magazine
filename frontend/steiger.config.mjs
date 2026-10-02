import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: ["**/generated/**"],
  },
  {
    // Шаблон: entities/features создаются заранее, до страниц, которые их используют.
    // Включите обратно, когда появятся страницы и виджеты.
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
]);
