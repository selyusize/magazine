import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { UpdateCatalogForProductHandler } from "../../command/update-catalog-for-product/handler";
import type { UpdateCatalogForProductBody } from "./schema";

/** POST /admin/products/:id/catalog — бренд и основная категория товара. */
@Injectable()
export class UpdateCatalogForProductAction implements Action<
  AuthenticatedMedusaRequest<UpdateCatalogForProductBody>
> {
  constructor(private readonly handler: UpdateCatalogForProductHandler) {}

  async handle(
    req: AuthenticatedMedusaRequest<UpdateCatalogForProductBody>,
    res: MedusaResponse,
  ): Promise<void> {
    const catalog = await this.handler.handle({
      product_id: req.params.id,
      brand_id: req.validatedBody.brand_id,
      main_category_id: req.validatedBody.main_category_id,
    });
    res.json({ catalog });
  }
}
