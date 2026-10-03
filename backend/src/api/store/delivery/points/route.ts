import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetPickupPointsByCityAction } from "@domain/delivery/action/get-pickup-points-by-city/action";
import type { GetPickupPointsByCityParams } from "@domain/delivery/action/get-pickup-points-by-city/schema";

/**
 * @oas [get] /store/delivery/points
 * operationId: GetDeliveryPoints
 * summary: Пункты выдачи перевозчика в городе
 * description: >-
 *   Для карты при выборе доставки. `id` пункта передаётся в data способа доставки как `pickup_point_id`
 *   (расчёт цены и добавление способа в корзину). Город не найден у перевозчика — пустой список.
 * x-authenticated: false
 * parameters:
 *   - name: x-publishable-api-key
 *     in: header
 *     required: true
 *     schema:
 *       type: string
 *   - name: provider
 *     in: query
 *     required: true
 *     schema:
 *       type: string
 *       enum: [cdek, yandex-delivery]
 *   - name: city
 *     in: query
 *     required: true
 *     schema:
 *       type: string
 *     example: Москва
 * tags:
 *   - Delivery
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           required:
 *             - points
 *           properties:
 *             points:
 *               type: array
 *               items:
 *                 type: object
 *                 required: [id, provider, name, type, address, city, postal_code, latitude, longitude, work_time, phone]
 *                 properties:
 *                   id:
 *                     type: string
 *                   provider:
 *                     type: string
 *                     enum: [cdek, yandex-delivery]
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [pickup_point, postamat, post_office]
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   postal_code:
 *                     type: string
 *                     nullable: true
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   work_time:
 *                     type: string
 *                     nullable: true
 *                   phone:
 *                     type: string
 *                     nullable: true
 */
export const GET = (
  req: MedusaRequest<unknown, GetPickupPointsByCityParams>,
  res: MedusaResponse,
) =>
  Container.from(req.scope).get(GetPickupPointsByCityAction).handle(req, res);
