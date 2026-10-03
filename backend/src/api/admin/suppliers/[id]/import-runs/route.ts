import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { PullSupplierPackageAction } from "@domain/exchange/action/pull-supplier-package/action";

export const POST = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(PullSupplierPackageAction).handle(req, res);
