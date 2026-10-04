import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import type { Middleware } from "@shared/contract/middleware";
import { ADMIN_SHOP_HEADER } from "@shared/shop/shop-context";

import { FindShopContextFetcher } from "../../query/find-shop-context/fetcher";

/**
 * Admin API: заголовок `x-shop-id` (переключатель магазина в админке) → `req.shop`. Без заголовка запрос идёт
 * дальше: «магазинные» роуты сами требуют магазин через `requireAdminShop` (400). Выключенный магазин в админке
 * доступен — его настраивают.
 */
@Injectable()
export class ResolveAdminShopMiddleware implements Middleware {
  constructor(private readonly fetcher: FindShopContextFetcher) {}

  async handle(
    req: MedusaRequest,
    _res: MedusaResponse,
    next: MedusaNextFunction,
  ): Promise<void> {
    const shopId = req.get(ADMIN_SHOP_HEADER)?.trim();
    if (!shopId) return next();

    const shop = await this.fetcher.fetch({ shop_id: shopId });
    if (!shop)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Магазин ${shopId} из заголовка ${ADMIN_SHOP_HEADER} не найден`,
      );

    req.shop = shop;
    next();
  }
}
