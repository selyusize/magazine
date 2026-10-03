import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { CreateSupplierOfferHandler } from "../../command/create-supplier-offer/handler";
import type { CreateSupplierOfferBody } from "../../crud/supplier-offer/schema";

/** POST /admin/supplier-offers — как создание в CRUD-фабрике, но с проверкой варианта и поставщика. */
@Injectable()
export class CreateSupplierOfferAction implements Action<
  AuthenticatedMedusaRequest<CreateSupplierOfferBody>
> {
  constructor(private readonly handler: CreateSupplierOfferHandler) {}

  async handle(
    req: AuthenticatedMedusaRequest<CreateSupplierOfferBody>,
    res: MedusaResponse,
  ): Promise<void> {
    const supplier_offer = await this.handler.handle(req.validatedBody);
    res.status(201).json({ supplier_offer });
  }
}
