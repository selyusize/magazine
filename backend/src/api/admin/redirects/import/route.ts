import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import { ImportRedirectsAction } from "@domain/redirect/action/import-redirects/action";
import type { ImportRedirectsBody } from "@domain/redirect/action/import-redirects/schema";

export const POST = (
  req: AuthenticatedMedusaRequest<ImportRedirectsBody>,
  res: MedusaResponse,
) => Container.from(req.scope).get(ImportRedirectsAction).handle(req, res);
