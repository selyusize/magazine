import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";
import { requireAdminShop } from "@shared/shop/shop-context";

import { GetRevalidateSecretByShopIdFetcher } from "../../query/get-revalidate-secret-by-shop-id/fetcher";

/** GET /admin/shops/current/revalidate-secret — адрес вебхука и секрет для env фронта текущего магазина. */
@Injectable()
export class GetRevalidateSecretByShopIdAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly fetcher: GetRevalidateSecretByShopIdFetcher) {}

  async handle(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
    const storefront_webhook = await this.fetcher.fetch({ shop_id: requireAdminShop(req).id });
    res.json({ storefront_webhook });
  }
}
