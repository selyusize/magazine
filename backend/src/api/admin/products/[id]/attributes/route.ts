import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetAttributeValuesByProductIdAction } from "@domain/attribute/action/get-attribute-values-by-product-id/action";
import { SetAttributeValuesForProductAction } from "@domain/attribute/action/set-attribute-values-for-product/action";
import type { SetAttributeValuesForProductBody } from "@domain/attribute/action/set-attribute-values-for-product/schema";

export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope)
    .get(GetAttributeValuesByProductIdAction)
    .handle(req, res);

export const POST = (
  req: AuthenticatedMedusaRequest<SetAttributeValuesForProductBody>,
  res: MedusaResponse,
) =>
  Container.from(req.scope)
    .get(SetAttributeValuesForProductAction)
    .handle(req, res);
