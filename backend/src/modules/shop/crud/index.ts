import { defineCRUD } from "@shared/crud/define-crud";
import type { CRUDRow } from "@shared/crud/definition";
import { recordOrNull, text, textOrNull, toDate } from "@shared/query/narrow";
import { parseShopSettings } from "@shared/shop/shop-settings";

import { SHOP_MODULE } from "../index";
import type { ShopDTO } from "./dto";
import { CreateShopSchema, UpdateShopSchema } from "./schema";

/** Поля Query для списка, карточки и ответа `create-shop`. */
export const SHOP_FIELDS = [
  "id",
  "slug",
  "name",
  "domain",
  "storefront_url",
  "is_active",
  "root_category_id",
  "settings",
  "sales_channel.id",
  "api_key.token",
  "created_at",
  "updated_at",
];

export const toShopDTO = (row: CRUDRow): ShopDTO => ({
  id: row.id,
  slug: text(row.slug),
  name: text(row.name),
  domain: text(row.domain),
  storefront_url: text(row.storefront_url),
  is_active: Boolean(row.is_active),
  root_category_id: text(row.root_category_id),
  settings: parseShopSettings(row.settings),
  sales_channel_id: textOrNull(recordOrNull(row.sales_channel)?.id),
  publishable_api_key: textOrNull(recordOrNull(row.api_key)?.token),
  created_at: toDate(row.created_at),
  updated_at: toDate(row.updated_at),
});

/**
 * Магазины сети — /admin/shops: список, карточка, изменение. Создание — свой use-case `create-shop` (канал продаж,
 * ключ, корневая категория), удаления нет. Схема создания здесь — для валидации POST в `middlewares`.
 */
export const shopCRUD = defineCRUD<ShopDTO>({
  entity: "shop",
  module: SHOP_MODULE,
  model: "Shop",
  label: "магазин",
  response: { one: "shop", many: "shops" },
  fields: SHOP_FIELDS,
  search: ["name", "slug", "domain"],
  order: { name: "ASC" },
  schemas: { create: CreateShopSchema, update: UpdateShopSchema },
  toDTO: toShopDTO,
});
