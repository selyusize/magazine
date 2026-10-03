import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Container } from "@container/index";
import type { CRUDBodyRequest } from "@shared/crud/define-crud";
import { filterPageCRUD } from "@domain/filter-page/crud";

export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(filterPageCRUD.actions.get).handle(req, res);

export const POST = (req: CRUDBodyRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(filterPageCRUD.actions.update).handle(req, res);

export const DELETE = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(filterPageCRUD.actions.delete).handle(req, res);
