import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { recordOf, recordOrNull, text } from "@shared/query/narrow";

import type { CatalogShopDTO } from "../find-shop-by-ref/dto";
import type { FindShopByCollectionIdQuery } from "./query";

/** Магазин коллекции по связи; коллекции нет — 404, магазин ещё не выбран — `null`. */
@Injectable()
export class FindShopByCollectionIdFetcher extends AbstractFetcher<
  FindShopByCollectionIdQuery,
  CatalogShopDTO | null
> {
  async fetch(query: FindShopByCollectionIdQuery): Promise<CatalogShopDTO | null> {
    const { data } = await this.graph({
      entity: "product_collection",
      fields: ["id", "shop.id", "shop.slug", "shop.name"],
      filters: { id: query.collection_id },
    });
    if (!data[0])
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Коллекция ${query.collection_id} не найдена`);
    const shop = recordOrNull(recordOf(data[0]).shop);
    return shop ? { id: text(shop.id), slug: text(shop.slug), name: text(shop.name) } : null;
  }
}
