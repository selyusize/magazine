import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { text } from "@shared/query/narrow";
import { shopHandleFilter } from "@shared/shop/shop-handle";

import type { ShopEntityDTO } from "./dto";
import type { FindShopEntityByIdQuery } from "./query";

/**
 * Сущность Medusa по id, если она из магазина: магазин категории и коллекции — префикс handle (`{магазин}ː…`).
 * Нет или чужая — `null`.
 */
@Injectable()
export class FindShopEntityByIdFetcher extends AbstractFetcher<FindShopEntityByIdQuery, ShopEntityDTO | null> {
  async fetch(query: FindShopEntityByIdQuery): Promise<ShopEntityDTO | null> {
    const { data } = await this.graph({
      entity: query.entity,
      fields: ["id"],
      filters: { id: query.id, ...shopHandleFilter(query.shop_slug) },
    });
    return data[0] ? { id: text(data[0].id) } : null;
  }
}
