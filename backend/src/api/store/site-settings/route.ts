import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetSiteSettingsAction } from "@domain/site-settings/action/get-site-settings/action";

/**
 * @oas [get] /store/site-settings
 * operationId: GetSiteSettings
 * summary: Реквизиты и контакты магазина
 * description: Название, домен, юрлицо (ИНН/ОГРН/КПП), контакты, адрес и соцсети — для Organization в schema.org и подвала.
 * x-authenticated: false
 * parameters:
 *   - name: x-publishable-api-key
 *     in: header
 *     required: true
 *     schema:
 *       type: string
 * tags:
 *   - Site Settings
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           required:
 *             - site_settings
 *           properties:
 *             site_settings:
 *               type: object
 *               required:
 *                 - name
 *                 - domain
 *                 - url
 *                 - legal
 *                 - contacts
 *                 - address
 *                 - social_links
 *               properties:
 *                 name:
 *                   type: string
 *                 domain:
 *                   type: string
 *                 url:
 *                   type: string
 *                 legal:
 *                   type: object
 *                   required:
 *                     - name
 *                     - inn
 *                     - ogrn
 *                     - kpp
 *                     - address
 *                   properties:
 *                     name:
 *                       type: string
 *                     inn:
 *                       type: string
 *                     ogrn:
 *                       type: string
 *                     kpp:
 *                       type: string
 *                       nullable: true
 *                     address:
 *                       type: string
 *                 contacts:
 *                   type: object
 *                   required:
 *                     - phone
 *                     - email
 *                     - working_hours
 *                   properties:
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *                     working_hours:
 *                       type: string
 *                 address:
 *                   type: object
 *                   required:
 *                     - country_code
 *                     - postal_code
 *                     - city
 *                     - street
 *                   properties:
 *                     country_code:
 *                       type: string
 *                     postal_code:
 *                       type: string
 *                     city:
 *                       type: string
 *                     street:
 *                       type: string
 *                 social_links:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required:
 *                       - name
 *                       - url
 *                     properties:
 *                       name:
 *                         type: string
 *                       url:
 *                         type: string
 */
export const GET = (req: MedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(GetSiteSettingsAction).handle(req, res);
