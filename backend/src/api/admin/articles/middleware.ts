import type { MiddlewareRoute } from "@medusajs/framework/http";

import { articleCRUD } from "@domain/content/crud";

export const adminArticlesMiddleware: MiddlewareRoute[] =
  articleCRUD.middlewares("/admin/articles");
