import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import type { Middleware } from "@shared/contract/middleware";
import { requireAdminShop, type ShopContext } from "@shared/shop/shop-context";
import type { ShopOwnedRoute } from "@shared/shop/shop-ownership";

import { FindOwnerShopByEntityIdFetcher } from "../../query/find-owner-shop-by-entity-id/fetcher";

/**
 * Сущность из `:id` должна принадлежать магазину запроса: Admin API — текущему (`x-shop-id`, без заголовка — 400),
 * Store API — магазину ключа (`requireShop`). Чужая и несуществующая — 404 одинаково: из магазина B не видно даже
 * того, что такой id есть в A. Правила — реестры `shopOwnedRoutes` и `storeShopOwnedRoutes`, точка входа —
 * `src/api/middlewares/shop-context.ts`.
 */
@Injectable()
export class CheckShopOwnershipMiddleware {
  constructor(private readonly fetcher: FindOwnerShopByEntityIdFetcher) {}

  /** Middleware для одного правила реестра; `shopOf` — магазин запроса (по умолчанию — админки). */
  for(rule: ShopOwnedRoute, shopOf: (req: MedusaRequest) => ShopContext = requireAdminShop): Middleware {
    return {
      handle: async (
        req: MedusaRequest,
        _res: MedusaResponse,
        next: MedusaNextFunction,
      ): Promise<void> => {
        const shop = shopOf(req);
        const id = req.params.id;
        const owner = await this.fetcher.fetch({
          entity: rule.entity,
          id,
          shop_field: rule.shop_field,
        });
        if (owner?.shop_id !== shop.id)
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Не найдено в магазине «${shop.name}»: ${rule.label} ${id}`,
          );
        next();
      },
    };
  }
}
