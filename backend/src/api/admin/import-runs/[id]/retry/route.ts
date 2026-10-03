import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { RetryImportRunAction } from "@domain/exchange/action/retry-import-run/action";

export const POST = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(RetryImportRunAction).handle(req, res);
