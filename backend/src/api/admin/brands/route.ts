import type { MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import type {
  CRUDBodyRequest,
  CRUDListRequest,
} from "@shared/crud/define-crud";
import { brandCRUD } from "@domain/brand/crud";

export const GET = (req: CRUDListRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(brandCRUD.actions.list).handle(req, res);

export const POST = (req: CRUDBodyRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(brandCRUD.actions.create).handle(req, res);
