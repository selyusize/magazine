import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetRedirectsForStorefrontAction } from "@domain/redirect/action/get-redirects-for-storefront/action";

/**
 * @oas [get] /store/redirects
 * operationId: GetRedirects
 * summary: Все редиректы витрины
 * description: Таблица целиком — витрина держит её у себя и редиректит без запроса на каждый путь. Цепочек нет.
 * x-authenticated: false
 * parameters:
 *   - name: x-publishable-api-key
 *     in: header
 *     required: true
 *     schema:
 *       type: string
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
 *             - redirects
 *           properties:
 *             redirects:
 *               type: array
 *               items:
 *                 type: object
 *                 required:
 *                   - from_path
 *                   - to_path
 *                   - code
 *                 properties:
 *                   from_path:
 *                     type: string
 *                   to_path:
 *                     type: string
 *                     nullable: true
 *                     description: null — страницы больше нет (410)
 *                   code:
 *                     type: integer
 *                     enum: [301, 302, 410]
 */
export const GET = (req: MedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope)
    .get(GetRedirectsForStorefrontAction)
    .handle(req, res);
