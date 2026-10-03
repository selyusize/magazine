import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetSupplierOffersByProductIdAction } from "@domain/supplier/action/get-supplier-offers-by-product-id/action";

export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope)
    .get(GetSupplierOffersByProductIdAction)
    .handle(req, res);
