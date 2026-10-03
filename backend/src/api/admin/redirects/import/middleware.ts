import {
  validateAndTransformBody,
  type MiddlewareRoute,
} from "@medusajs/framework/http";

import { ImportRedirectsSchema } from "@domain/redirect/action/import-redirects/schema";

export const adminRedirectsImportMiddleware: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/redirects/import",
    // CSV до 5 МБ — больше стандартного лимита JSON
    bodyParser: { sizeLimit: "6mb" },
    middlewares: [validateAndTransformBody(ImportRedirectsSchema)],
  },
];
