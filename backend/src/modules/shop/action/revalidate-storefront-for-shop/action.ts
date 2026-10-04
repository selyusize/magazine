import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";
import { ALL_STOREFRONT_TAGS } from "@shared/service/cache-invalidation/storefront-tags";
import { requireAdminShop } from "@shared/shop/shop-context";

import { QueueStorefrontRevalidationsHandler } from "../../command/queue-storefront-revalidations/handler";

/**
 * POST /admin/storefront-revalidations — «обновить витрину целиком»: все групповые теги текущего магазина в очередь
 * (после ручной правки в обход событий, смены шаблонов витрины). 202: вебхук уйдёт после окна дебаунса.
 */
@Injectable()
export class RevalidateStorefrontForShopAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly handler: QueueStorefrontRevalidationsHandler) {}

  async handle(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
    const queued = await this.handler.handle({
      batches: [{ shop_id: requireAdminShop(req).id, tags: ALL_STOREFRONT_TAGS }],
    });
    res.status(202).json(queued);
  }
}
