import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetCurrentAdminShopAction } from "@domain/shop/action/get-current-admin-shop/action";

/** Магазин из заголовка `x-shop-id`: без заголовка — 400, неизвестный id — 400. */
export const GET = (req: MedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(GetCurrentAdminShopAction).handle(req, res);
