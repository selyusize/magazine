import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { SetAttributeValuesForProductHandler } from "../../command/set-attribute-values-for-product/handler";
import type { SetAttributeValuesForProductBody } from "./schema";

/** POST /admin/products/:id/attributes — заменить значения характеристик товара или варианта. */
@Injectable()
export class SetAttributeValuesForProductAction implements Action<
  AuthenticatedMedusaRequest<SetAttributeValuesForProductBody>
> {
  constructor(private readonly handler: SetAttributeValuesForProductHandler) {}

  async handle(
    req: AuthenticatedMedusaRequest<SetAttributeValuesForProductBody>,
    res: MedusaResponse,
  ): Promise<void> {
    const attribute_values = await this.handler.handle({
      product_id: req.params.id,
      variant_id: req.validatedBody.variant_id ?? null,
      values: req.validatedBody.values,
    });
    res.json({ attribute_values });
  }
}
