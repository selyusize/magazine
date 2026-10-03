import type { BreadcrumbsConfig } from "@shared/config";
import { routes } from "@shared/config";

/** Крошка: название раздела и относительный адрес */
export type Crumb = { name: string; href: string };

export type Trail = {
  /** Цепочка от главной до текущей страницы включительно */
  items: Crumb[];
  /** Родительский раздел для кнопки «назад». Нет — у страницы нет родителя или кнопка выключена */
  back?: Crumb;
};

/**
 * Полная цепочка: главная (если задана в конфиге) + разделы страницы. Пустые и повторяющиеся подряд
 * адреса отбрасываются — страница может передать раздел, совпадающий с главной.
 * Одна крошка — не цепочка: показывать нечего.
 */
export function buildTrail(items: Crumb[], config: BreadcrumbsConfig): Trail | null {
  const all = [...(config.home ? [{ name: config.home, href: routes.home }] : []), ...items].reduce<Crumb[]>(
    (list, item) => (item.name && item.href && item.href !== list.at(-1)?.href ? [...list, item] : list),
    [],
  );
  if (all.length < 2) return null;
  return { items: all, back: config.back === "never" ? undefined : all.at(-2) };
}
