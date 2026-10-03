import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import type { CRUDBodyRequest } from "@shared/crud/define-crud";
import { articleCRUD } from "@domain/content/crud";

export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(articleCRUD.actions.get).handle(req, res);

export const POST = (req: CRUDBodyRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(articleCRUD.actions.update).handle(req, res);

export const DELETE = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(articleCRUD.actions.delete).handle(req, res);
