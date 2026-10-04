import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";
import { requireAdminShop } from "@shared/shop/shop-context";

/** GET /admin/shops/current — магазин из заголовка `x-shop-id`: переключатель проверяет сохранённый выбор. */
@Injectable()
export class GetCurrentAdminShopAction implements Action {
  async handle(req: MedusaRequest, res: MedusaResponse): Promise<void> {
    res.json({ shop: requireAdminShop(req) });
  }
}
