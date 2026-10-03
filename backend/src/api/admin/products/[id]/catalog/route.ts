import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetCatalogByProductIdAction } from "@domain/catalog/action/get-catalog-by-product-id/action";
import { UpdateCatalogForProductAction } from "@domain/catalog/action/update-catalog-for-product/action";
import type { UpdateCatalogForProductBody } from "@domain/catalog/action/update-catalog-for-product/schema";

export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(GetCatalogByProductIdAction).handle(req, res);

export const POST = (
  req: AuthenticatedMedusaRequest<UpdateCatalogForProductBody>,
  res: MedusaResponse,
) =>
  Container.from(req.scope).get(UpdateCatalogForProductAction).handle(req, res);
