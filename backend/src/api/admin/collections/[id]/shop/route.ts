import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { AssignShopToCollectionAction } from "@domain/catalog/action/assign-shop-to-collection/action";
import type { AssignShopToCollectionBody } from "@domain/catalog/action/assign-shop-to-collection/schema";
import { GetShopByCollectionIdAction } from "@domain/catalog/action/get-shop-by-collection-id/action";

export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(GetShopByCollectionIdAction).handle(req, res);

export const POST = (req: AuthenticatedMedusaRequest<AssignShopToCollectionBody>, res: MedusaResponse) =>
  Container.from(req.scope).get(AssignShopToCollectionAction).handle(req, res);
