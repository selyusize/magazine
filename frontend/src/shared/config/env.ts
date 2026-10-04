const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

export const env = {
  /** Публичный адрес витрины без / на конце: канонические ссылки, Open Graph, JSON-LD. */
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  /** Адрес Medusa для браузера (вшивается в бандл при сборке). */
  publicApiUrl,
  /**
   * Адрес Medusa для запросов с сервера Next (RSC, route handlers).
   * В Docker это внутренний адрес сервиса, например http://backend:9000; читается в рантайме.
   */
  serverApiUrl: process.env.API_INTERNAL_URL ?? publicApiUrl,
  /** Publishable API key Medusa — обязателен для всех /store-запросов. */
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "",
  /**
   * Регион Medusa для цен в списках товаров (каталог, поиск) — только на сервере, читается в рантайме.
   * Не задан — берётся первый регион магазина (GET /store/regions, кешируется).
   */
  regionId: process.env.MEDUSA_REGION_ID ?? "",
  /**
   * Секрет вебхука ревалидации `POST /api/revalidate` — только на сервере, читается в рантайме. Тот же, что у
   * магазина в админке Medusa («Обновление витрины»); пусто — вебхук отклоняется (401), кэш живёт по TTL.
   */
  revalidateSecret: process.env.REVALIDATE_SECRET ?? "",
} as const;
