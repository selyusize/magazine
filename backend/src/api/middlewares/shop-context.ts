import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MedusaStoreRequest,
  MiddlewareRoute,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import { CheckRequestOriginMiddleware } from "@domain/shop/action/check-request-origin/middleware";
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

/** Магазин запроса и CORS по таблице магазинов — для всех роутов `/store`, `/auth` и `/admin`, включая роуты Medusa. */
export const shopContextMiddleware: MiddlewareRoute[] = [
  { matcher: "/store*", middlewares: [checkRequestOrigin, resolveStoreShop] },
  { matcher: "/auth*", middlewares: [checkRequestOrigin] },
  { matcher: "/admin*", middlewares: [resolveAdminShop] },
];
