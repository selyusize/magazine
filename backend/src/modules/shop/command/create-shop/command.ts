import type { ShopSettings } from "@shared/shop/shop-settings";

/** Новый магазин сети: всё остальное (канал продаж, ключ, корневая категория) workflow создаёт сам. */
export type CreateShopCommand = {
  slug: string;
  name: string;
  domain: string;
  storefront_url: string;
  settings: ShopSettings;
};
