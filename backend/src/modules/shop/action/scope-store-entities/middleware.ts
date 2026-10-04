import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import type { Middleware } from "@shared/contract/middleware";
import { requireShop } from "@shared/shop/shop-context";
import { type StoreShopScopedRoute, withShopHandleFilter } from "@shared/shop/shop-handle";

import { FindShopEntityByIdFetcher } from "../../query/find-shop-entity-by-id/fetcher";

/**
 * Store API: сущности Medusa без канала продаж (категории, коллекции) — только магазина ключа. Medusa сама их по
 * магазину не делит: список получает фильтр по префиксу handle, карточка чужой — 404. Правила — реестр
 * `storeShopScopedRoutes` (`src/container/common/shop.ts`), точка входа — `src/api/middlewares/shop-context.ts`.
 */
@Injectable()
export class ScopeStoreEntitiesMiddleware {
  constructor(private readonly fetcher: FindShopEntityByIdFetcher) {}

  /** Список: после валидации query роута Medusa (`req.filterableFields` уже собран). */
  list(): Middleware {
    return {
      handle: async (req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction): Promise<void> => {
        req.filterableFields = withShopHandleFilter(req.filterableFields ?? {}, requireShop(req).slug);
        next();
      },
    };
  }

  /** Карточка `{matcher}/:id`: чужая и несуществующая — одинаково 404. */
  item(rule: StoreShopScopedRoute): Middleware {
    return {
      handle: async (req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction): Promise<void> => {
        const shop = requireShop(req);
        const found = await this.fetcher.fetch({ entity: rule.entity, id: req.params.id, shop_slug: shop.slug });
        if (!found)
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Не найдено в магазине «${shop.name}»: ${rule.label} ${req.params.id}`,
          );
        next();
      },
    };
  }
}
