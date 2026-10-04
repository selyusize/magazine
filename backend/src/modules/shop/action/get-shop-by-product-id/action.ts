import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetShopByProductIdFetcher } from "../../query/get-shop-by-product-id/fetcher";

/**
 * GET /admin/products/:id/shop — магазин товара, сетевой роут (без `x-shop-id`): по нему блоки карточки товара
 * ходят в разделы именно его магазина, что бы ни было выбрано в переключателе.
 */
@Injectable()
export class GetShopByProductIdAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly fetcher: GetShopByProductIdFetcher) {}

  async handle(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
    res.json({ shop: await this.fetcher.fetch({ product_id: req.params.id }) });
  }
}
