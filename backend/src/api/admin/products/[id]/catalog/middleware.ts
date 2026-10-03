import {
  type MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http";

import { UpdateCatalogForProductSchema } from "@domain/catalog/action/update-catalog-for-product/schema";

export const adminProductCatalogMiddleware: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/products/:id/catalog",
    middlewares: [validateAndTransformBody(UpdateCatalogForProductSchema)],
  },
];
