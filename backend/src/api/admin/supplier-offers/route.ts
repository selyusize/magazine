import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import type { CRUDListRequest } from "@shared/crud/define-crud";
import { CreateSupplierOfferAction } from "@domain/supplier/action/create-supplier-offer/action";
import { supplierOfferCRUD } from "@domain/supplier/crud/supplier-offer";
import type { CreateSupplierOfferBody } from "@domain/supplier/crud/supplier-offer/schema";

export const GET = (req: CRUDListRequest, res: MedusaResponse) =>
  Container.from(req.scope)
    .get(supplierOfferCRUD.actions.list)
    .handle(req, res);

export const POST = (
  req: AuthenticatedMedusaRequest<CreateSupplierOfferBody>,
  res: MedusaResponse,
) => Container.from(req.scope).get(CreateSupplierOfferAction).handle(req, res);
