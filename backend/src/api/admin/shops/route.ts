import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import type { CRUDListRequest } from "@shared/crud/define-crud";
import { CreateShopAction } from "@domain/shop/action/create-shop/action";
import { shopCRUD } from "@domain/shop/crud";
import type { CreateShopBody } from "@domain/shop/crud/schema";

export const GET = (req: CRUDListRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(shopCRUD.actions.list).handle(req, res);

export const POST = (
  req: AuthenticatedMedusaRequest<CreateShopBody>,
  res: MedusaResponse,
) => Container.from(req.scope).get(CreateShopAction).handle(req, res);
