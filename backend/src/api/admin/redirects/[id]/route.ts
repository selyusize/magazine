import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import { DeleteRedirectAction } from "@domain/redirect/action/delete-redirect/action";

export const DELETE = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(DeleteRedirectAction).handle(req, res);
