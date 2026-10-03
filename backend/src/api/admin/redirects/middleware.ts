import {
  validateAndTransformBody,
  validateAndTransformQuery,
  type MiddlewareRoute,
} from "@medusajs/framework/http";

import { GetRedirectsForAdminSchema } from "@domain/redirect/action/get-redirects-for-admin/schema";
import { SaveRedirectSchema } from "@domain/redirect/action/save-redirect/schema";

/** Авторизацию /admin/* Medusa проверяет сама — здесь только валидация. */
export const adminRedirectsMiddleware: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/redirects",
    middlewares: [validateAndTransformQuery(GetRedirectsForAdminSchema, {})],
  },
  {
    method: ["POST"],
    matcher: "/admin/redirects",
    middlewares: [validateAndTransformBody(SaveRedirectSchema)],
  },
];
