import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import type { Middleware } from "@shared/contract/middleware";
import { requireAdminShop } from "@shared/shop/shop-context";
import type { ShopOwnedRoute } from "@shared/shop/shop-ownership";

import { FindOwnerShopByEntityIdFetcher } from "../../query/find-owner-shop-by-entity-id/fetcher";

/**
 * Admin API: сущность из `:id` должна принадлежать текущему магазину (`x-shop-id`). Чужая и несуществующая — 404
 * одинаково: из магазина B не видно даже того, что такой id есть в A. Без заголовка — 400 (`requireAdminShop`).
 * Правила — реестр `shopOwnedRoutes`, точка входа — `src/api/middlewares/shop-context.ts`.
 */
@Injectable()
export class CheckShopOwnershipMiddleware {
  constructor(private readonly fetcher: FindOwnerShopByEntityIdFetcher) {}

  /** Middleware для одного правила реестра. */
  for(rule: ShopOwnedRoute): Middleware {
    return {
      handle: async (
        req: MedusaRequest,
        _res: MedusaResponse,
        next: MedusaNextFunction,
      ): Promise<void> => {
        const shop = requireAdminShop(req);
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
