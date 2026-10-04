import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { recordOf, text } from "@shared/query/narrow";
import { PRODUCT_SHOP_FIELDS, toProductShop } from "@shared/shop/catalog-shop";

import type { ProductShopRefDTO } from "./dto";
import type { FindProductShopsByIdsQuery } from "./query";

const toProductShopRefDTO = (value: unknown): ProductShopRefDTO => {
  const product = recordOf(value);
  return {
    product_id: text(product.id),
    title: text(product.title) || text(product.id),
    shop_id: toProductShop(product).shop_id,
  };
};

/** Магазины товаров по id: несуществующие id в ответ не попадают. */
@Injectable()
export class FindProductShopsByIdsFetcher extends AbstractFetcher<FindProductShopsByIdsQuery, ProductShopRefDTO[]> {
  async fetch(query: FindProductShopsByIdsQuery): Promise<ProductShopRefDTO[]> {
    if (!query.product_ids.length) return [];
    const { data } = await this.graph({
      entity: "product",
      fields: ["id", "title", ...PRODUCT_SHOP_FIELDS],
      filters: { id: query.product_ids },
    });
    return data.map(toProductShopRefDTO);
  }
}
