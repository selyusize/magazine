/** Параметр выбранного варианта в адресе страницы товара */
export const PRODUCT_VARIANT_PARAM = "variant";

/**
 * Все пути витрины в одном месте: ссылки в хедере, футере и страницах строятся отсюда.
 * Пути страниц сущностей должны совпадать с `backend/src/modules/redirect/service/path.ts` — по ним ставятся 301/410.
 */
export const routes = {
  home: "/",
  catalog: "/catalog",
  category: (handle: string) => `/catalog/${handle}`,
  collection: (handle: string) => `/collections/${handle}`,
  /** Посадочная «категория + фильтры»: handle уникален внутри категории */
  filterPage: (categoryHandle: string, handle: string) => `/catalog/${categoryHandle}/${handle}`,
  brand: (handle: string) => `/brands/${handle}`,
  article: (handle: string) => `/blog/${handle}`,
  /** variant — ссылка на конкретный вариант: на странице он будет выбран (каноническая — без него) */
  product: (handle: string, variant?: string) =>
    variant ? `/products/${handle}?${PRODUCT_VARIANT_PARAM}=${encodeURIComponent(variant)}` : `/products/${handle}`,
  search: (query?: string) => (query ? `/search?q=${encodeURIComponent(query)}` : "/search"),
  cart: "/cart",
  wishlist: "/wishlist",
  checkout: "/checkout",
  login: "/login",
  register: "/register",
  account: "/account",
  orders: "/account/orders",
  stores: "/stores",
  privacy: "/privacy",
  terms: "/terms",
} as const;
