import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetImportRunsAction } from "@domain/exchange/action/get-import-runs/action";
import type { GetImportRunsParams } from "@domain/exchange/action/get-import-runs/schema";

export const GET = (req: AuthenticatedMedusaRequest<unknown, GetImportRunsParams>, res: MedusaResponse) =>
  Container.from(req.scope).get(GetImportRunsAction).handle(req, res);
