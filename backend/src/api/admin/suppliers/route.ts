import type { MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import type {
  CRUDBodyRequest,
  CRUDListRequest,
} from "@shared/crud/define-crud";
import { supplierCRUD } from "@domain/supplier/crud/supplier";

export const GET = (req: CRUDListRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(supplierCRUD.actions.list).handle(req, res);

export const POST = (req: CRUDBodyRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(supplierCRUD.actions.create).handle(req, res);
