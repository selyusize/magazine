import {
  type MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http";

import { SetAttributeValuesForProductSchema } from "@domain/attribute/action/set-attribute-values-for-product/schema";

export const adminProductAttributesMiddleware: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/products/:id/attributes",
    middlewares: [validateAndTransformBody(SetAttributeValuesForProductSchema)],
  },
];
