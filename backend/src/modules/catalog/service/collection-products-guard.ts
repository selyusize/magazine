import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";

import { FindCollectionShopsByIdsFetcher } from "../query/find-collection-shops-by-ids/fetcher";
import { FindProductShopsByIdsFetcher } from "../query/find-product-shops-by-ids/fetcher";
import { foreignCollectionProducts } from "./collection-shop-rules";

/**
 * Товары в коллекцию списком (`POST /admin/collections/:id/products`): Medusa кладёт их workflow без хуков товара,
 * поэтому правило «коллекция — из магазина товара» (`foreign_collection`) проверяем до него.
 */
@Injectable()
export class CollectionProductsGuard {
  constructor(
    private readonly collections: FindCollectionShopsByIdsFetcher,
    private readonly products: FindProductShopsByIdsFetcher,
  ) {}

  async assert(input: { collection_id: string; product_ids: string[] }): Promise<void> {
    if (!input.product_ids.length) return;
    const [collection] = await this.collections.fetch({ collection_ids: [input.collection_id] });
    const products = await this.products.fetch({ product_ids: input.product_ids });
    const foreign = foreignCollectionProducts(collection?.shop_id ?? null, products);
    if (foreign.length)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Коллекция «${collection?.title ?? input.collection_id}» — только товары своего магазина: ${foreign.map((title) => `«${title}»`).join(", ")} из другого`,
      );
  }
}
