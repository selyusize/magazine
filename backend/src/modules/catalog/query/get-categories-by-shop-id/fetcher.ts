import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { recordOf, records, text, textOrNull } from "@shared/query/narrow";
import { toPublicHandle } from "@shared/shop/shop-handle";

import type { ShopCategoryDTO } from "./dto";
import type { GetCategoriesByShopIdQuery } from "./query";

const toShopCategoryDTO = (row: Record<string, unknown>): ShopCategoryDTO => ({
  id: text(row.id),
  name: text(row.name),
  handle: toPublicHandle(text(row.handle)),
  parent_category_id: textOrNull(row.parent_category_id),
});

/**
 * Категории дерева магазина по связи `shop ↔ product_category`, без корня (корень — служебный, товарам его не
 * дают), по названию. Магазина нет — пустой список.
 */
@Injectable()
export class GetCategoriesByShopIdFetcher extends AbstractFetcher<GetCategoriesByShopIdQuery, ShopCategoryDTO[]> {
  async fetch(query: GetCategoriesByShopIdQuery): Promise<ShopCategoryDTO[]> {
    const { data } = await this.graph({
      entity: "shop",
      fields: [
        "root_category_id",
        "product_categories.id",
        "product_categories.name",
        "product_categories.handle",
        "product_categories.parent_category_id",
      ],
      filters: { id: query.shop_id },
    });
    const shop = recordOf(data[0]);
    const rootId = textOrNull(shop.root_category_id);
    return records(shop.product_categories)
      .map(toShopCategoryDTO)
      .filter((category) => category.id !== rootId)
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }
}
