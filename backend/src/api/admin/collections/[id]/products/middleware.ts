import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import { CheckCollectionProductsMiddleware } from "@domain/catalog/action/check-collection-products/middleware";

const checkCollectionProducts = (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) =>
  Container.from(req.scope).get(CheckCollectionProductsMiddleware).handle(req, res, next).catch(next);

/** Роут Medusa: товары в коллекцию списком обходят хуки товара — проверяем магазин до него. */
export const adminCollectionProductsMiddleware: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/collections/:id/products",
    middlewares: [checkCollectionProducts],
  },
];
