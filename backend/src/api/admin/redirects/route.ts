import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetRedirectsForAdminAction } from "@domain/redirect/action/get-redirects-for-admin/action";
import type { GetRedirectsForAdminParams } from "@domain/redirect/action/get-redirects-for-admin/schema";
import { SaveRedirectAction } from "@domain/redirect/action/save-redirect/action";
import type { SaveRedirectBody } from "@domain/redirect/action/save-redirect/schema";

export const GET = (
  req: AuthenticatedMedusaRequest<unknown, GetRedirectsForAdminParams>,
  res: MedusaResponse,
) => Container.from(req.scope).get(GetRedirectsForAdminAction).handle(req, res);

export const POST = (
  req: AuthenticatedMedusaRequest<SaveRedirectBody>,
  res: MedusaResponse,
) => Container.from(req.scope).get(SaveRedirectAction).handle(req, res);
