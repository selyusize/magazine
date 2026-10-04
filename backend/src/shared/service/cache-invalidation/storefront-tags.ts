/**
 * Теги кэша витрины — контракт с фронтами магазинов (`docs/storefront.md`). Тег без магазина: один фронт — один
 * магазин, вебхук ревалидации уходит только витринам затронутых магазинов.
 *
 * Групповой тег (`products`) стоит на каждом запросе своей группы, тег сущности (`product:<handle>`) — ещё и на
 * запросах этой сущности. Handle — витрины, без префикса магазина.
 */
export const STOREFRONT_TAGS = {
  /** Магазин и реквизиты сети: подвал, Organization, контакты. */
  shop: "shop",
  /** Все запросы товаров: листинги, поиск, карточки. */
  products: "products",
  categories: "categories",
  /** Меню и дерево категорий. */
  navigation: "navigation",
  collections: "collections",
  brands: "brands",
  articles: "articles",
  filterPages: "filter-pages",
  /** Таблица редиректов `proxy.ts`. */
  redirects: "redirects",
  sitemap: "sitemap",
  /** Регионы и валюта цен — общие на сеть. */
  regions: "regions",
} as const;

/** Тип сущности в теге → её групповой тег: им заменяются теги сущностей, когда их слишком много. */
export const STOREFRONT_TAG_GROUPS = {
  product: STOREFRONT_TAGS.products,
  category: STOREFRONT_TAGS.categories,
  collection: STOREFRONT_TAGS.collections,
  brand: STOREFRONT_TAGS.brands,
  article: STOREFRONT_TAGS.articles,
  "filter-page": STOREFRONT_TAGS.filterPages,
} as const;

export type StorefrontTagEntity = keyof typeof STOREFRONT_TAG_GROUPS;

/** Тег одной сущности: `product:utyug-philips`. */
export const entityTag = (entity: StorefrontTagEntity, handle: string): string => `${entity}:${handle}`;

/** Все групповые теги — «обновить витрину целиком» из админки. */
export const ALL_STOREFRONT_TAGS: string[] = Object.values(STOREFRONT_TAGS);

const groupOf = (tag: string): string | null => {
  const separator = tag.indexOf(":");
  if (separator < 0) return null;
  const entity = tag.slice(0, separator);
  return Object.entries(STOREFRONT_TAG_GROUPS).find(([key]) => key === entity)?.[1] ?? null;
};

/**
 * Пачка тегов для одного вебхука: без повторов, по алфавиту. Больше `limit` тегов сущностей (импорт поменял тысячи
 * товаров) — они заменяются групповыми: один `products` вместо тысяч `product:<handle>`.
 */
export function mergeStorefrontTags(current: readonly string[], incoming: readonly string[], limit: number): string[] {
  const tags = [...new Set([...current, ...incoming])];
  const entityTags = tags.filter((tag) => groupOf(tag) !== null);
  const merged =
    entityTags.length > limit ? tags.map((tag) => groupOf(tag) ?? tag) : tags;
  return [...new Set(merged)].sort();
}
