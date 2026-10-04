import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { shopIdAt } from "@shared/shop/shop-ownership";

import type { OwnerShopDTO } from "./dto";
import type { FindOwnerShopByEntityIdQuery } from "./query";

/** Магазин, которому принадлежит сущность (для проверки доступа в админке). Сущности нет — `null`. */
@Injectable()
export class FindOwnerShopByEntityIdFetcher extends AbstractFetcher<
  FindOwnerShopByEntityIdQuery,
  OwnerShopDTO | null
> {
  async fetch(query: FindOwnerShopByEntityIdQuery): Promise<OwnerShopDTO | null> {
    const { data } = await this.graph({
      entity: query.entity,
      fields: ["id", query.shop_field],
      filters: { id: query.id },
    });
    return data[0] ? { shop_id: shopIdAt(data[0], query.shop_field) } : null;
  }
}
