import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";
import { requireAdminShop } from "@shared/shop/shop-context";

import { GetStorefrontRevalidationsByShopIdFetcher } from "../../query/get-storefront-revalidations-by-shop-id/fetcher";

/** GET /admin/storefront-revalidations — журнал вебхуков ревалидации витрины текущего магазина (`x-shop-id`). */
@Injectable()
export class GetStorefrontRevalidationsByShopIdAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly fetcher: GetStorefrontRevalidationsByShopIdFetcher) {}

  async handle(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
    const storefront_revalidations = await this.fetcher.fetch({ shop_id: requireAdminShop(req).id });
    res.json({ storefront_revalidations });
  }
}
