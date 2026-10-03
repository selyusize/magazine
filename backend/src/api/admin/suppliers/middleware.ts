import type { MiddlewareRoute } from "@medusajs/framework/http";

import { supplierCRUD } from "@domain/supplier/crud/supplier";

export const adminSuppliersMiddleware: MiddlewareRoute[] =
  supplierCRUD.middlewares("/admin/suppliers");
