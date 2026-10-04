import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Middleware } from "@shared/contract/middleware";
import { toPublicHandles } from "@shared/shop/shop-handle";

/**
 * Store API: handle сущностей Medusa в ответах — без префикса магазина (`olisaːutyug` → `utyug`), в том числе у роутов
 * Medusa (`/store/products`, `/store/product-categories`, корзина). Витрина и внешние фронты префикса не видят.
 * Точка входа — `src/api/middlewares/shop-context.ts`, после `ResolveStoreShopMiddleware`.
 */
@Injectable()
export class PublishStoreHandlesMiddleware implements Middleware {
  async handle(
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction,
  ): Promise<void> {
    // Без магазина (роут без ключа) handle магазинов не отдаются
    if (req.shop) {
      const json = res.json.bind(res);
      res.json = (body?: unknown) => json(toPublicHandles(body));
    }
    next();
  }
}
