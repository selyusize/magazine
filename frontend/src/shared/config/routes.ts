/** Все пути витрины в одном месте: ссылки в хедере, футере и страницах строятся отсюда. */
export const routes = {
  home: "/",
  catalog: "/catalog",
  category: (handle: string) => `/catalog/${handle}`,
  product: (handle: string) => `/products/${handle}`,
  search: (query?: string) => (query ? `/search?q=${encodeURIComponent(query)}` : "/search"),
  cart: "/cart",
  checkout: "/checkout",
  login: "/login",
  register: "/register",
  account: "/account",
  orders: "/account/orders",
  privacy: "/privacy",
  terms: "/terms",
} as const;
