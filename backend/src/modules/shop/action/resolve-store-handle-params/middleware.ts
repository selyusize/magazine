import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Middleware } from "@shared/contract/middleware";
import { type StoreHandleParams, toShopHandleParams } from "@shared/shop/shop-handle";

/**
 * Store API: фильтры по handle в query (`/store/products?handle=utyug`) — handle витрины; до валидации Medusa
 * они получают префикс магазина ключа (`olisaːutyug`), поэтому находятся только сущности этого магазина.
 * Правила — реестр `storeHandleParams` (`src/container/common/shop.ts`).
 */
@Injectable()
export class ResolveStoreHandleParamsMiddleware {
  /** Middleware для одного правила реестра. */
  for(rule: StoreHandleParams): Middleware {
    return {
      handle: async (
        req: MedusaRequest,
        _res: MedusaResponse,
        next: MedusaNextFunction,
      ): Promise<void> => {
        if (req.shop) Object.assign(req.query, toShopHandleParams({ shop: req.shop.slug, query: req.query, params: rule.params }));
        next();
      },
    };
  }
}
