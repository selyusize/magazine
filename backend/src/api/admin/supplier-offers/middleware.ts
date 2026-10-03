import type { MiddlewareRoute } from "@medusajs/framework/http";

import { supplierOfferCRUD } from "@domain/supplier/crud/supplier-offer";

export const adminSupplierOffersMiddleware: MiddlewareRoute[] =
  supplierOfferCRUD.middlewares("/admin/supplier-offers");
