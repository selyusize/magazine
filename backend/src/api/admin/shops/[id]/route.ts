import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import type { CRUDBodyRequest } from "@shared/crud/define-crud";
import { shopCRUD } from "@domain/shop/crud";

/** Удаления нет: магазин выключают (`is_active: false`), его заказы и история остаются. */
export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(shopCRUD.actions.get).handle(req, res);

export const POST = (req: CRUDBodyRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(shopCRUD.actions.update).handle(req, res);
