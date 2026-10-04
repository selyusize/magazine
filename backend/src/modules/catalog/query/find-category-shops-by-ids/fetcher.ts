import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { recordOf, recordOrNull, text, textOrNull } from "@shared/query/narrow";
import { categoryShopId, CATEGORY_SHOP_FIELDS } from "@shared/shop/catalog-shop";

import type { CategoryShopDTO } from "./dto";
import type { FindCategoryShopsByIdsQuery } from "./query";

/**
 * Категории с магазинами родителя, корня и своей связи — для правил `category-shop-rules`. Несуществующие
 * категории в ответ не попадают.
 */
@Injectable()
export class FindCategoryShopsByIdsFetcher extends AbstractFetcher<FindCategoryShopsByIdsQuery, CategoryShopDTO[]> {
  async fetch(query: FindCategoryShopsByIdsQuery): Promise<CategoryShopDTO[]> {
    if (!query.category_ids.length) return [];

    const [{ data: categories }, { data: shops }] = await Promise.all([
      this.graph({
        entity: "product_category",
        fields: [
          "id",
          "name",
          "parent_category_id",
          ...CATEGORY_SHOP_FIELDS,
          ...CATEGORY_SHOP_FIELDS.map((field) => `parent_category.${field}`),
        ],
        filters: { id: query.category_ids },
      }),
      this.graph({
        entity: "shop",
        fields: ["id", "root_category_id"],
        filters: { root_category_id: query.category_ids },
      }),
    ]);
    const rootOf = new Map(shops.map((shop): [string, string] => [text(shop.root_category_id), text(shop.id)]));

    return categories.map((value): CategoryShopDTO => {
      const category = recordOf(value);
      const id = text(category.id);
      return {
        id,
        name: text(category.name, id),
        has_parent: textOrNull(category.parent_category_id) !== null,
        parent_shop_id: categoryShopId(recordOrNull(category.parent_category)),
        root_of_shop_id: textOrNull(rootOf.get(id)),
        shop_id: categoryShopId(category),
      };
    });
  }
}
