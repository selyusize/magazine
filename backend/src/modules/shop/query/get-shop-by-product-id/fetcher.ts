import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { records, text } from "@shared/query/narrow";
import { shopIdAt } from "@shared/shop/shop-ownership";
import { PRODUCT_SHOP_FIELDS } from "@shared/shop/catalog-shop";

import type { ProductShopDTO } from "./dto";
import type { GetShopByProductIdQuery } from "./query";

/** Магазин товара по его каналу продаж. Нет товара или он не в магазине — 404. */
@Injectable()
export class GetShopByProductIdFetcher extends AbstractFetcher<GetShopByProductIdQuery, ProductShopDTO> {
  async fetch(query: GetShopByProductIdQuery): Promise<ProductShopDTO> {
    const { data: products } = await this.graph({
      entity: "product",
      fields: ["id", ...PRODUCT_SHOP_FIELDS],
      filters: { id: query.product_id },
    });
    const shopId = shopIdAt(products[0], "sales_channels.shop.id");
    const { data: shops } = shopId
      ? await this.graph({ entity: "shop", fields: ["id", "slug", "name"], filters: { id: shopId } })
      : { data: [] };
    const [shop] = records(shops);
    if (!shop)
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Магазин товара ${query.product_id} не найден`);
    return { id: text(shop.id), slug: text(shop.slug), name: text(shop.name) };
  }
}
