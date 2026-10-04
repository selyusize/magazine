import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { recordOf, recordOrNull, records, text, textOrNull } from "@shared/query/narrow";
import { categoryShopId, collectionShopId, PRODUCT_SHOP_FIELDS, toProductShop } from "@shared/shop/catalog-shop";

import { findProductShopProblems } from "../../service/product-shop-rules";
import type { ShopProblemDTO } from "./dto";
import type { FindShopProblemsByProductIdsQuery } from "./query";

const toShopProblemDTO = (value: unknown): ShopProblemDTO => {
  const product = recordOf(value);
  const id = text(product.id);
  const attributeShopIds = records(product.attribute_values).flatMap((row) => {
    const shopId = textOrNull(recordOrNull(row.attribute)?.shop_id);
    return shopId ? [shopId] : [];
  });
  return {
    product_id: id,
    title: textOrNull(product.title) || id,
    problems: findProductShopProblems({
      ...toProductShop(product),
      brand_shop_id: textOrNull(recordOrNull(product.brand)?.shop_id),
      main_category_shop_id: categoryShopId(recordOrNull(product.product_main_category)?.product_category),
      category_shop_ids: records(product.categories).map(categoryShopId),
      attribute_shop_ids: [...new Set(attributeShopIds)],
      collection_shop_id: collectionShopId(recordOrNull(product.collection)),
    }),
  };
};

/**
 * Товары из списка, нарушающие правила магазина (`product-shop-rules`): не ровно один канал магазина, бренд,
 * основная категория, категории, характеристики или коллекция чужого магазина. Всё в порядке — пустой массив.
 */
@Injectable()
export class FindShopProblemsByProductIdsFetcher extends AbstractFetcher<
  FindShopProblemsByProductIdsQuery,
  ShopProblemDTO[]
> {
  async fetch(query: FindShopProblemsByProductIdsQuery): Promise<ShopProblemDTO[]> {
    if (!query.product_ids.length) return [];

    const { data } = await this.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        ...PRODUCT_SHOP_FIELDS,
        "brand.shop_id",
        "product_main_category.product_category.shop.id",
        "categories.shop.id",
        "attribute_values.attribute.shop_id",
        "collection.shop.id",
      ],
      filters: { id: query.product_ids },
    });
    return data.map(toShopProblemDTO).filter((problem) => problem.problems.length > 0);
  }
}
