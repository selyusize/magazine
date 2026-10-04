import { z } from "@medusajs/framework/zod";

import { Injectable } from "@shared/container";
import { recordOrNull, records, text, textOrNull } from "@shared/query/narrow";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import { SHOP_CACHE_TAG, SHOP_CACHE_TTL } from "../../cache";
import type { ShopContextDTO } from "./dto";
import type { FindShopContextQuery } from "./query";

const SHOP_FIELDS = [
  "id",
  "slug",
  "name",
  "domain",
  "storefront_url",
  "is_active",
  "sales_channel.id",
];

const ShopContextSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  domain: z.string(),
  storefront_url: z.string(),
  is_active: z.boolean(),
  sales_channel_id: z.string().nullable(),
});

/** В кэше и «не найдено»: ключ без магазина спрашивают так же часто, как ключ с магазином. */
const CachedSchema = z.object({ shop: ShopContextSchema.nullable() });

const toShopContextDTO = (row: Record<string, unknown>): ShopContextDTO => ({
  id: text(row.id),
  slug: text(row.slug),
  name: text(row.name),
  domain: text(row.domain),
  storefront_url: text(row.storefront_url),
  is_active: Boolean(row.is_active),
  sales_channel_id: textOrNull(recordOrNull(row.sales_channel)?.id),
});

/**
 * Магазин запроса — на каждый Store-запрос, поэтому из кэша (тег `shops`, сброс по `shop.*`). Выключенный магазин
 * тоже отдаётся: решение 403/400 — за middleware.
 */
@Injectable()
export class FindShopContextFetcher extends AbstractFetcher<
  FindShopContextQuery,
  ShopContextDTO | null
> {
  async fetch(query: FindShopContextQuery): Promise<ShopContextDTO | null> {
    const key =
      "publishable_key" in query
        ? `shop-context:key:${query.publishable_key}`
        : `shop-context:id:${query.shop_id}`;
    const { shop } = await this.cached(
      key,
      SHOP_CACHE_TTL,
      CachedSchema,
      async () => ({ shop: await this.load(query) }),
      [SHOP_CACHE_TAG],
    );
    return shop;
  }

  private async load(
    query: FindShopContextQuery,
  ): Promise<ShopContextDTO | null> {
    if ("shop_id" in query) {
      const { data } = await this.graph({
        entity: "shop",
        fields: SHOP_FIELDS,
        filters: { id: query.shop_id },
      });
      const [row] = records(data);
      return row ? toShopContextDTO(row) : null;
    }

    const { data } = await this.graph({
      entity: "api_key",
      fields: SHOP_FIELDS.map((field) => `shop.${field}`),
      filters: { token: query.publishable_key, type: "publishable" },
    });
    const shop = recordOrNull(records(data)[0]?.shop);
    return shop ? toShopContextDTO(shop) : null;
  }
}
