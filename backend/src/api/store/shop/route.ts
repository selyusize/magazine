import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetShopForStorefrontAction } from "@domain/shop/action/get-shop-for-storefront/action";

/**
 * @oas [get] /store/shop
 * operationId: GetShop
 * summary: Магазин витрины и реквизиты сети
 * description: Магазин publishable-ключа (название, домен, адрес витрины, логотип, контакты) и реквизиты сети (юрлицо, ИНН/ОГРН/КПП, адрес, контакты) — для подвала и Organization в schema.org. Ключ без магазина или выключенный магазин — 403.
 * x-authenticated: false
 * parameters:
 *   - name: x-publishable-api-key
 *     in: header
 *     required: true
 *     schema:
 *       type: string
 * tags:
 *   - Shop
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           required:
 *             - shop
 *           properties:
 *             shop:
 *               type: object
 *               required:
 *                 - slug
 *                 - name
 *                 - domain
 *                 - url
 *                 - logo_url
 *                 - contacts
 *                 - network
 *               properties:
 *                 slug:
 *                   type: string
 *                 name:
 *                   type: string
 *                 domain:
 *                   type: string
 *                 url:
 *                   type: string
 *                 logo_url:
 *                   type: string
 *                   nullable: true
 *                 contacts:
 *                   type: object
 *                   required:
 *                     - phone
 *                     - email
 *                     - address
 *                   properties:
 *                     phone:
 *                       type: string
 *                       nullable: true
 *                     email:
 *                       type: string
 *                       nullable: true
 *                     address:
 *                       type: string
 *                       nullable: true
 *                 network:
 *                   type: object
 *                   required:
 *                     - name
 *                     - legal
 *                     - phone
 *                     - email
 *                   properties:
 *                     name:
 *                       type: string
 *                       nullable: true
 *                     legal:
 *                       type: object
 *                       required:
 *                         - name
 *                         - inn
 *                         - ogrn
 *                         - kpp
 *                         - address
 *                       properties:
 *                         name:
 *                           type: string
 *                           nullable: true
 *                         inn:
 *                           type: string
 *                           nullable: true
 *                         ogrn:
 *                           type: string
 *                           nullable: true
 *                         kpp:
 *                           type: string
 *                           nullable: true
 *                         address:
 *                           type: string
 *                           nullable: true
 *                     phone:
 *                       type: string
 *                       nullable: true
 *                     email:
 *                       type: string
 *                       nullable: true
 *   "403":
 *     description: Ключ не привязан к магазину или магазин выключен
 */
export const GET = (req: MedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(GetShopForStorefrontAction).handle(req, res);
