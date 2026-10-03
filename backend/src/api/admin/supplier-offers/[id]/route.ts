import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import type { CRUDBodyRequest } from "@shared/crud/define-crud";
import { supplierOfferCRUD } from "@domain/supplier/crud/supplier-offer";

export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(supplierOfferCRUD.actions.get).handle(req, res);

export const POST = (req: CRUDBodyRequest, res: MedusaResponse) =>
  Container.from(req.scope)
    .get(supplierOfferCRUD.actions.update)
    .handle(req, res);

export const DELETE = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope)
    .get(supplierOfferCRUD.actions.delete)
    .handle(req, res);
