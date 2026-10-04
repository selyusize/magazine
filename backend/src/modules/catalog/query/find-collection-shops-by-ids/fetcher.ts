import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { recordOf, records, text } from "@shared/query/narrow";
import { COLLECTION_SHOP_FIELDS, collectionShopId, PRODUCT_SHOP_FIELDS, toProductShop } from "@shared/shop/catalog-shop";

import type { CollectionShopDTO } from "./dto";
import type { FindCollectionShopsByIdsQuery } from "./query";

const toCollectionShopDTO = (value: unknown): CollectionShopDTO => {
  const collection = recordOf(value);
  return {
    id: text(collection.id),
    title: text(collection.title) || text(collection.id),
    shop_id: collectionShopId(collection),
    product_shop_ids: records(collection.products).map((product) => toProductShop(product).shop_id),
  };
};

/** Коллекции по id с магазином (связь) и магазинами их товаров — для правил `collection-shop-rules`. */
@Injectable()
export class FindCollectionShopsByIdsFetcher extends AbstractFetcher<
  FindCollectionShopsByIdsQuery,
  CollectionShopDTO[]
> {
  async fetch(query: FindCollectionShopsByIdsQuery): Promise<CollectionShopDTO[]> {
    if (!query.collection_ids.length) return [];
    const { data } = await this.graph({
      entity: "product_collection",
      fields: [
        "id",
        "title",
        ...COLLECTION_SHOP_FIELDS,
        ...PRODUCT_SHOP_FIELDS.map((field) => `products.${field}`),
      ],
      filters: { id: query.collection_ids },
    });
    return data.map(toCollectionShopDTO);
  }
}
