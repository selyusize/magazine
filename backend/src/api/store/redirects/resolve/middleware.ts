import {
  validateAndTransformQuery,
  type MiddlewareRoute,
} from "@medusajs/framework/http";

import { FindRedirectByPathSchema } from "@domain/redirect/action/find-redirect-by-path/schema";

export const storeRedirectsResolveMiddleware: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/redirects/resolve",
    middlewares: [validateAndTransformQuery(FindRedirectByPathSchema, {})],
  },
];
