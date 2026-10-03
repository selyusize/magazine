/** Транслитерация в духе Яндекса: короткие читаемые сочетания, без апострофов и диакритики. */
const CYRILLIC: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  // украинские и белорусские буквы встречаются в выгрузках поставщиков
  є: "e",
  і: "i",
  ї: "i",
  ґ: "g",
  ў: "u",
};

/** Готовый slug: латиница в нижнем регистре, цифры и одиночные дефисы между ними. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Длиннее — хуже для сниппета и не добавляет смысла; режем по границе слова. */
export const SLUG_MAX_LENGTH = 80;

/**
 * «Футболка хлопковая, 3XL» → `futbolka-hlopkovaya-3xl`. Для товаров, категорий, брендов, статей.
 * Пустая строка, если в тексте нет ни букв, ни цифр — запасной вариант выбирает вызывающий.
 */
export function toSlug(text: string): string {
  const latin = [...text.toLowerCase()]
    .map((char) => CYRILLIC[char] ?? char)
    .join("")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");

  const slug = latin.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  if (slug.length <= SLUG_MAX_LENGTH) return slug;

  const cut = slug.slice(0, SLUG_MAX_LENGTH + 1);
  const lastHyphen = cut.lastIndexOf("-");
  return (
    lastHyphen > 0 ? cut.slice(0, lastHyphen) : cut.slice(0, SLUG_MAX_LENGTH)
  ).replace(/-+$/, "");
}

/** Первый свободный вариант: `slug`, `slug-2`, `slug-3`… `isTaken` проверяет занятость (обычно — запросом в БД). */
export async function toUniqueSlug(
  slug: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  for (let index = 1; ; index++) {
    const suffix = index === 1 ? "" : `-${index}`;
    const candidate =
      slug.slice(0, SLUG_MAX_LENGTH - suffix.length).replace(/-+$/, "") +
      suffix;
    if (!(await isTaken(candidate))) return candidate;
  }
}
