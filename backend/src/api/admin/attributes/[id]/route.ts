import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import type { CRUDBodyRequest } from "@shared/crud/define-crud";
import { attributeCRUD } from "@domain/attribute/crud";

export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(attributeCRUD.actions.get).handle(req, res);

export const POST = (req: CRUDBodyRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(attributeCRUD.actions.update).handle(req, res);

export const DELETE = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(attributeCRUD.actions.delete).handle(req, res);
