import {
  validateAndTransformQuery,
  type MiddlewareRoute,
} from "@medusajs/framework/http";

import { GetPickupPointsByCitySchema } from "@domain/delivery/action/get-pickup-points-by-city/schema";

export const storeDeliveryPointsMiddleware: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/delivery/points",
    middlewares: [validateAndTransformQuery(GetPickupPointsByCitySchema, {})],
  },
];
