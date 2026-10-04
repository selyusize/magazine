import type { ShopSettings } from "@shared/shop/shop-settings";

/** Новый магазин сети: всё остальное (канал продаж, ключ, корневая категория) workflow создаёт сам. */
export type CreateShopCommand = {
  slug: string;
  name: string;
  domain: string;
  storefront_url: string;
  settings: ShopSettings;
  /**
   * Секрет вебхука ревалидации витрины; не задан — случайный. Задают сид (`INITIAL_SHOP_REVALIDATE_SECRET`, тот же
   * секрет в env фронта olisa) и тесты.
   */
  revalidate_secret?: string;
};
