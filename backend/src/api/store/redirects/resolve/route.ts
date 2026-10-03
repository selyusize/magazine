import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { FindRedirectByPathAction } from "@domain/redirect/action/find-redirect-by-path/action";
import type { FindRedirectByPathParams } from "@domain/redirect/action/find-redirect-by-path/schema";

/**
 * @oas [get] /store/redirects/resolve
 * operationId: GetRedirectsResolve
 * summary: Редирект для пути
 * description: Путь нормализуется (домен, query, завершающий слеш, %-кодирование). Нет правила — redirect = null.
 * x-authenticated: false
 * parameters:
 *   - name: x-publishable-api-key
 *     in: header
 *     required: true
 *     schema:
 *       type: string
 *   - name: path
 *     in: query
 *     required: true
 *     schema:
 *       type: string
 *     example: /products/old-handle
 * tags:
 *   - Redirects
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           required:
 *             - redirect
 *           properties:
 *             redirect:
 *               nullable: true
 *               type: object
 *               required:
 *                 - from_path
 *                 - to_path
 *                 - code
 *               properties:
 *                 from_path:
 *                   type: string
 *                 to_path:
 *                   type: string
 *                   nullable: true
 *                   description: null — страницы больше нет (410)
 *                 code:
 *                   type: integer
 *                   enum: [301, 302, 410]
 */
export const GET = (
  req: MedusaRequest<unknown, FindRedirectByPathParams>,
  res: MedusaResponse,
) => Container.from(req.scope).get(FindRedirectByPathAction).handle(req, res);
