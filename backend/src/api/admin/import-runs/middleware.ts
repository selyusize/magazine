import {
  type MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";

import { GetExchangeReviewBySupplierIdSchema } from "@domain/exchange/action/get-exchange-review-by-supplier-id/schema";
import { GetImportRunsSchema } from "@domain/exchange/action/get-import-runs/schema";
import { MapExchangeGroupToCategorySchema } from "@domain/exchange/action/map-exchange-group-to-category/schema";
import { MapExchangePropertyToAttributeSchema } from "@domain/exchange/action/map-exchange-property-to-attribute/schema";

/** Админка импорта поставщиков (этап 4.5): история запусков, маппинг групп и свойств, очередь разбора. */
export const adminExchangeMiddleware: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/import-runs",
    middlewares: [validateAndTransformQuery(GetImportRunsSchema, {})],
  },
  {
    method: ["GET"],
    matcher: "/admin/suppliers/:id/exchange-review",
    middlewares: [validateAndTransformQuery(GetExchangeReviewBySupplierIdSchema, {})],
  },
  {
    method: ["POST"],
    matcher: "/admin/exchange-groups/:id",
    middlewares: [validateAndTransformBody(MapExchangeGroupToCategorySchema)],
  },
  {
    method: ["POST"],
    matcher: "/admin/exchange-properties/:id",
    middlewares: [validateAndTransformBody(MapExchangePropertyToAttributeSchema)],
  },
];
