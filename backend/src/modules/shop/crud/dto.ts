import type { ShopSettings } from "@shared/shop/shop-settings";

export type ShopDTO = {
  id: string;
  slug: string;
  name: string;
  domain: string;
  storefront_url: string;
  is_active: boolean;
  root_category_id: string;
  settings: ShopSettings;
  /** Канал продаж магазина. */
  sales_channel_id: string | null;
  /** Токен publishable-ключа — в inventory Ansible фронта магазина (`publishable_key`). */
  publishable_api_key: string | null;
  created_at: Date;
  updated_at: Date;
};
