import { type MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework/http";

import { AssignShopToCollectionSchema } from "@domain/catalog/action/assign-shop-to-collection/schema";

/** Сетевой роут (без `x-shop-id`): магазин коллекции выбирают в её карточке дашборда Medusa. */
export const adminCollectionShopMiddleware: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/collections/:id/shop",
    middlewares: [validateAndTransformBody(AssignShopToCollectionSchema)],
  },
];
