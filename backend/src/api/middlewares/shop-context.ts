import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MedusaStoreRequest,
  MiddlewareRoute,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import { shopOwnedRoutes } from "@container/common/shop";
import type { ShopOwnedRoute } from "@shared/shop/shop-ownership";
import { CheckRequestOriginMiddleware } from "@domain/shop/action/check-request-origin/middleware";
import { CheckShopOwnershipMiddleware } from "@domain/shop/action/check-shop-ownership/middleware";
import { ResolveAdminShopMiddleware } from "@domain/shop/action/resolve-admin-shop/middleware";
import { ResolveStoreShopMiddleware } from "@domain/shop/action/resolve-store-shop/middleware";

const checkRequestOrigin = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) =>
  Container.from(req.scope)
    .get(CheckRequestOriginMiddleware)
    .handle(req, res, next)
    .catch(next);

const resolveStoreShop = (
  req: MedusaStoreRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) =>
  Container.from(req.scope)
    .get(ResolveStoreShopMiddleware)
    .handle(req, res, next)
    .catch(next);

const resolveAdminShop = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) =>
  Container.from(req.scope)
    .get(ResolveAdminShopMiddleware)
    .handle(req, res, next)
    .catch(next);

const checkShopOwnership =
  (rule: ShopOwnedRoute) =>
  (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) =>
    Container.from(req.scope)
      .get(CheckShopOwnershipMiddleware)
      .for(rule)
      .handle(req, res, next)
      .catch(next);

/**
 * Магазин запроса и CORS по таблице магазинов — для всех роутов `/store`, `/auth` и `/admin`, включая роуты Medusa;
 * доступ к сущностям магазина по id в админке — по реестру `shopOwnedRoutes`.
 */
export const shopContextMiddleware: MiddlewareRoute[] = [
  { matcher: "/store*", middlewares: [checkRequestOrigin, resolveStoreShop] },
  { matcher: "/auth*", middlewares: [checkRequestOrigin] },
  { matcher: "/admin*", middlewares: [resolveAdminShop] },
  // Без метода — для пути и всего под ним (`/admin/suppliers/:id/exchange-groups`)
  ...shopOwnedRoutes.map((rule) => ({
    matcher: rule.matcher,
    middlewares: [checkShopOwnership(rule)],
  })),
];
