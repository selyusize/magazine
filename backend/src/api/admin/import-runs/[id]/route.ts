import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetImportRunByIdAction } from "@domain/exchange/action/get-import-run-by-id/action";

export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(GetImportRunByIdAction).handle(req, res);
