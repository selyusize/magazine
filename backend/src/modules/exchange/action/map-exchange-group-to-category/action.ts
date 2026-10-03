import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { MapExchangeGroupToCategoryHandler } from "../../command/map-exchange-group-to-category/handler";
import type { MapExchangeGroupToCategoryBody } from "./schema";

type Request = AuthenticatedMedusaRequest<MapExchangeGroupToCategoryBody>;

/** POST /admin/exchange-groups/:id — категория магазина для группы поставщика. */
@Injectable()
export class MapExchangeGroupToCategoryAction implements Action<Request> {
  constructor(private readonly handler: MapExchangeGroupToCategoryHandler) {}

  async handle(req: Request, res: MedusaResponse): Promise<void> {
    const exchange_group = await this.handler.handle({
      id: req.params.id,
      category_id: req.validatedBody.category_id,
    });
    res.json({ exchange_group });
  }
}
