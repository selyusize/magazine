import { MedusaError } from "@medusajs/framework/utils";

import { isRecord, recordOrNull, records, textOrNull } from "../query/narrow";

/**
 * Магазин товара — магазин его единственного канала продаж (`sales_channels.shop`): товар состоит ровно в одном
 * канале магазина (план, шаг 4). Поля Query, которые читает `toProductShop`.
 */
export const PRODUCT_SHOP_FIELDS = ["sales_channels.id", "sales_channels.shop.id"];

/** Магазин категории — по связи `shop ↔ product_category` (`src/links/shop-product-category.ts`). */
export const CATEGORY_SHOP_FIELDS = ["shop.id"];

/** Магазин коллекции — по связи `shop ↔ product_collection` (`src/links/shop-product-collection.ts`). */
export const COLLECTION_SHOP_FIELDS = ["shop.id"];

/** Каналы товара и их магазины: канал без магазина — `null`. */
export type ProductShop = {
  /** Магазины каналов товара в порядке каналов; канал без магазина — `null`. */
  channel_shop_ids: (string | null)[];
  /** Магазин товара, если он ровно в одном канале магазина; иначе `null`. */
  shop_id: string | null;
};

/** Магазин товара из строки Query с `PRODUCT_SHOP_FIELDS`. */
export function toProductShop(row: unknown): ProductShop {
  const channels = isRecord(row) ? records(row.sales_channels) : [];
  const channel_shop_ids = channels.map((channel) => textOrNull(recordOrNull(channel.shop)?.id));
  const [only] = channel_shop_ids;
  return {
    channel_shop_ids,
    shop_id: channel_shop_ids.length === 1 ? (only ?? null) : null,
  };
}

/** Магазин категории из строки Query с `CATEGORY_SHOP_FIELDS` (или вложенной `…product_category`). */
export function categoryShopId(row: unknown): string | null {
  return isRecord(row) ? textOrNull(recordOrNull(row.shop)?.id) : null;
}

/** Магазин коллекции из строки Query с `COLLECTION_SHOP_FIELDS` (или вложенной `…collection`). */
export function collectionShopId(row: unknown): string | null {
  return isRecord(row) ? textOrNull(recordOrNull(row.shop)?.id) : null;
}

/**
 * `additional_data` создания корня дерева в `create-shop`: магазина ещё нет, связь корня ставит сам `create-shop`,
 * а хук `categoriesCreated` такие категории пропускает.
 */
export const SHOP_ROOT_CATEGORY_DATA = { shop_root_category: true };

export const isShopRootCategoryData = (additionalData: unknown): boolean =>
  isRecord(additionalData) && additionalData.shop_root_category === true;

/**
 * Ссылка на сущность другого магазина в команде (бренд товару, характеристика свойству) — 400 (arch-guide, п.9).
 * `what` — с названием или id: «Бренд brand_1».
 */
export const foreignShopError = (what: string): MedusaError =>
  new MedusaError(MedusaError.Types.INVALID_DATA, `${what} — из другого магазина`);
