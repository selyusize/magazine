import type { MiddlewareRoute } from "@medusajs/framework/http";

import { shopCRUD } from "@domain/shop/crud";

export const adminShopsMiddleware: MiddlewareRoute[] =
  shopCRUD.middlewares("/admin/shops");
