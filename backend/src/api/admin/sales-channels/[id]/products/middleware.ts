import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import { RejectSalesChannelProductsMiddleware } from "@domain/catalog/action/reject-sales-channel-products/middleware";

const rejectSalesChannelProducts = (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) =>
  Container.from(req.scope).get(RejectSalesChannelProductsMiddleware).handle(req, res, next).catch(next);

/** Роут Medusa: привязка товаров к каналу списком обходит хуки товара — закрыт (товар живёт в одном магазине). */
export const adminSalesChannelProductsMiddleware: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/sales-channels/:id/products",
    middlewares: [rejectSalesChannelProducts],
  },
];
