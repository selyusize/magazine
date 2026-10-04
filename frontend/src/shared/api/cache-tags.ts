/**
 * Теги кэша fetch витрины — контракт с бэкендом (`backend/docs/storefront.md`): изменение сущности в админке →
 * вебхук `POST /api/revalidate` с этими тегами. Групповой тег ставится на каждый запрос группы, тег сущности — ещё и
 * на запросы одной сущности (handle из URL витрины).
 */
export const cacheTags = {
  /** Магазин и реквизиты сети. */
  shop: "shop",
  products: "products",
  product: (handle: string) => `product:${handle}`,
  categories: "categories",
  category: (handle: string) => `category:${handle}`,
  /** Меню и дерево категорий. */
  navigation: "navigation",
  collections: "collections",
  collection: (handle: string) => `collection:${handle}`,
  brands: "brands",
  brand: (handle: string) => `brand:${handle}`,
  articles: "articles",
  article: (handle: string) => `article:${handle}`,
  filterPages: "filter-pages",
  /** Таблица редиректов proxy.ts. */
  redirects: "redirects",
  sitemap: "sitemap",
  /** Регионы и валюта цен — общие на сеть. */
  regions: "regions",
} as const;
