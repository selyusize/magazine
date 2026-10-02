const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

export const env = {
  /** Адрес Medusa для браузера (вшивается в бандл при сборке). */
  publicApiUrl,
  /**
   * Адрес Medusa для запросов с сервера Next (RSC, route handlers).
   * В Docker это внутренний адрес сервиса, например http://backend:9000; читается в рантайме.
   */
  serverApiUrl: process.env.API_INTERNAL_URL ?? publicApiUrl,
  /** Publishable API key Medusa — обязателен для всех /store-запросов. */
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "",
} as const;
