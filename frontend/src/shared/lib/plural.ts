/**
 * Склонение по числу: plural(13, ["товар", "товара", "товаров"]) → «товаров».
 * Формы — по правилам Intl.PluralRules: one / few / many (для ru); other — запасная форма для других языков.
 */
export type PluralForms = [one: string, few: string, many: string];

export function plural(count: number, [one, few, many]: PluralForms, locale = "ru-RU"): string {
  switch (new Intl.PluralRules(locale).select(count)) {
    case "one":
      return one;
    case "few":
      return few;
    default:
      return many;
  }
}
