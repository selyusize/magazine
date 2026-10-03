import type { MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import type {
  CRUDBodyRequest,
  CRUDListRequest,
} from "@shared/crud/define-crud";
import { attributeCRUD } from "@domain/attribute/crud";

export const GET = (req: CRUDListRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(attributeCRUD.actions.list).handle(req, res);

export const POST = (req: CRUDBodyRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(attributeCRUD.actions.create).handle(req, res);
