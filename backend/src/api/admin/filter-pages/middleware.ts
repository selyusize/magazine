import type { MiddlewareRoute } from "@medusajs/framework/http";

import { filterPageCRUD } from "@domain/filter-page/crud";

export const adminFilterPagesMiddleware: MiddlewareRoute[] =
  filterPageCRUD.middlewares("/admin/filter-pages");
