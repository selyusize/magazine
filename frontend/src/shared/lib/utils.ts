import { createCn } from "cn/config";

/**
 * Склейка классов с разрешением конфликтов Tailwind. Знает о токенах бренда (tokens.css):
 * без этого text-300 считался бы цветом и вытеснял text-primary-foreground у кнопки.
 * Новые утилиты в @theme — добавить сюда. Компоненты shadcn после `shadcn add` импортируют "cn" напрямую —
 * заменить импорт на @shared/lib/utils.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["100", "200", "300", "400", "500", "600", "700", "800", "900"] }],
      "font-weight": [{ font: ["button"] }],
    },
  },
});
