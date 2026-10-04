import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";
import { requireAdminShop } from "@shared/shop/shop-context";

import { RegenerateRevalidateSecretForShopHandler } from "../../command/regenerate-revalidate-secret-for-shop/handler";

/** POST /admin/shops/current/revalidate-secret — новый секрет вебхука текущего магазина. */
@Injectable()
export class RegenerateRevalidateSecretForShopAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly handler: RegenerateRevalidateSecretForShopHandler) {}

  async handle(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
    const storefront_webhook = await this.handler.handle({ shop_id: requireAdminShop(req).id });
    res.json({ storefront_webhook });
  }
}
