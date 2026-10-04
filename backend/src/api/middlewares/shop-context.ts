import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MedusaStoreRequest,
  MiddlewareRoute,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import {
  shopOwnedRoutes,
  storeHandleParams,
  storeShopOwnedRoutes,
  storeShopScopedRoutes,
} from "@container/common/shop";
import { requireShop } from "@shared/shop/shop-context";
import type { StoreHandleParams, StoreShopScopedRoute } from "@shared/shop/shop-handle";
import type { ShopOwnedRoute } from "@shared/shop/shop-ownership";
import { CheckRequestOriginMiddleware } from "@domain/shop/action/check-request-origin/middleware";
import { CheckShopOwnershipMiddleware } from "@domain/shop/action/check-shop-ownership/middleware";
import { PublishStoreHandlesMiddleware } from "@domain/shop/action/publish-store-handles/middleware";
import { ResolveAdminShopMiddleware } from "@domain/shop/action/resolve-admin-shop/middleware";
import { ResolveStoreHandleParamsMiddleware } from "@domain/shop/action/resolve-store-handle-params/middleware";
import { ResolveStoreShopMiddleware } from "@domain/shop/action/resolve-store-shop/middleware";
import { ScopeStoreEntitiesMiddleware } from "@domain/shop/action/scope-store-entities/middleware";

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

const publishStoreHandles = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) =>
  Container.from(req.scope)
    .get(PublishStoreHandlesMiddleware)
    .handle(req, res, next)
    .catch(next);

const resolveStoreHandleParams =
  (rule: StoreHandleParams) =>
  (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) =>
    Container.from(req.scope)
      .get(ResolveStoreHandleParamsMiddleware)
      .for(rule)
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

const checkStoreShopOwnership =
  (rule: ShopOwnedRoute) =>
  (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) =>
    Container.from(req.scope)
      .get(CheckShopOwnershipMiddleware)
      .for(rule, requireShop)
      .handle(req, res, next)
      .catch(next);

const scopeStoreList = (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) =>
  Container.from(req.scope).get(ScopeStoreEntitiesMiddleware).list().handle(req, res, next).catch(next);

const scopeStoreItem =
  (rule: StoreShopScopedRoute) =>
  (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) =>
    Container.from(req.scope)
      .get(ScopeStoreEntitiesMiddleware)
      .item(rule)
      .handle(req, res, next)
      .catch(next);

/**
 * Магазин запроса и CORS по таблице магазинов — для всех роутов `/store`, `/auth` и `/admin`, включая роуты Medusa;
 * handle сущностей Medusa в Store API — без префикса магазина (ответы) и с ним (фильтры из `storeHandleParams`);
 * категории и коллекции витрины — только магазина ключа (`storeShopScopedRoutes`); доступ к сущностям магазина по id —
 * по реестрам `shopOwnedRoutes` (админка) и `storeShopOwnedRoutes` (витрина).
 */
export const shopContextMiddleware: MiddlewareRoute[] = [
  { matcher: "/store*", middlewares: [checkRequestOrigin, resolveStoreShop, publishStoreHandles] },
  // Без метода и до валидации query роутов Medusa: фильтр уже с префиксом магазина
  ...storeHandleParams.map((rule) => ({
    matcher: rule.matcher,
    middlewares: [resolveStoreHandleParams(rule)],
  })),
  // С методом — после валидации query роута Medusa: фильтр по магазину ложится в готовый `req.filterableFields`
  ...storeShopScopedRoutes.flatMap((rule): MiddlewareRoute[] => [
    { method: ["GET"], matcher: rule.matcher, middlewares: [scopeStoreList] },
    { method: ["GET"], matcher: `${rule.matcher}/:id`, middlewares: [scopeStoreItem(rule)] },
  ]),
  ...storeShopOwnedRoutes.map((rule) => ({
    matcher: rule.matcher,
    middlewares: [checkStoreShopOwnership(rule)],
  })),
  { matcher: "/auth*", middlewares: [checkRequestOrigin] },
  { matcher: "/admin*", middlewares: [resolveAdminShop] },
  // Без метода — для пути и всего под ним (`/admin/suppliers/:id/exchange-groups`); `methods` — только для них
  ...shopOwnedRoutes.map((rule) => ({
    matcher: rule.matcher,
    ...(rule.methods ? { method: rule.methods } : {}),
    middlewares: [checkShopOwnership(rule)],
  })),
];
