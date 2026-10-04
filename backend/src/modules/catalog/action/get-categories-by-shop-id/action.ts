import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";
import { requireAdminShop } from "@shared/shop/shop-context";

import { GetCategoriesByShopIdFetcher } from "../../query/get-categories-by-shop-id/fetcher";

/**
 * GET /admin/shops/current/categories — категории дерева текущего магазина (`x-shop-id`) для выбора в формах.
 * Список Medusa `/admin/product-categories` — по всей сети, поэтому формы берут категории здесь.
 */
@Injectable()
export class GetCategoriesByShopIdAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly fetcher: GetCategoriesByShopIdFetcher) {}

  async handle(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
    const product_categories = await this.fetcher.fetch({ shop_id: requireAdminShop(req).id });
    res.json({ product_categories });
  }
}
