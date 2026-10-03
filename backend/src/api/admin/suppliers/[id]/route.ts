import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import type { CRUDBodyRequest } from "@shared/crud/define-crud";
import { supplierCRUD } from "@domain/supplier/crud/supplier";

export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(supplierCRUD.actions.get).handle(req, res);

export const POST = (req: CRUDBodyRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(supplierCRUD.actions.update).handle(req, res);

export const DELETE = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(supplierCRUD.actions.delete).handle(req, res);
