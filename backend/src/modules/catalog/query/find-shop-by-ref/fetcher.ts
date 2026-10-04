import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { recordOf, text } from "@shared/query/narrow";

import type { CatalogShopDTO } from "./dto";
import type { FindShopByRefQuery } from "./query";

/** Магазин по ссылке (id из запроса или slug из префикса handle). Нет такого — `null`. */
@Injectable()
export class FindShopByRefFetcher extends AbstractFetcher<FindShopByRefQuery, CatalogShopDTO | null> {
  async fetch(query: FindShopByRefQuery): Promise<CatalogShopDTO | null> {
    const { data } = await this.graph({ entity: "shop", fields: ["id", "slug", "name"], filters: query.shop });
    const shop = recordOf(data[0]);
    return text(shop.id) ? { id: text(shop.id), slug: text(shop.slug), name: text(shop.name) } : null;
  }
}
