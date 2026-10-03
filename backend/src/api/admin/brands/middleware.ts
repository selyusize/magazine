import type { MiddlewareRoute } from "@medusajs/framework/http";

import { brandCRUD } from "@domain/brand/crud";

export const adminBrandsMiddleware: MiddlewareRoute[] =
  brandCRUD.middlewares("/admin/brands");
