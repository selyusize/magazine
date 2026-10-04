import {
  type MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http";

import { UpdateNetworkSettingsSchema } from "@domain/shop/action/update-network-settings/schema";

export const adminNetworkSettingsMiddleware: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/network-settings",
    middlewares: [validateAndTransformBody(UpdateNetworkSettingsSchema)],
  },
];
