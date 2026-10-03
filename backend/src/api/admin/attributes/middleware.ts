import type { MiddlewareRoute } from "@medusajs/framework/http";

import { attributeCRUD } from "@domain/attribute/crud";

export const adminAttributesMiddleware: MiddlewareRoute[] =
  attributeCRUD.middlewares("/admin/attributes");
