import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { MapExchangePropertyToAttributeHandler } from "../../command/map-exchange-property-to-attribute/handler";
import type { MapExchangePropertyToAttributeBody } from "./schema";

type Request = AuthenticatedMedusaRequest<MapExchangePropertyToAttributeBody>;

/** POST /admin/exchange-properties/:id — характеристика магазина для свойства поставщика. */
@Injectable()
export class MapExchangePropertyToAttributeAction implements Action<Request> {
  constructor(private readonly handler: MapExchangePropertyToAttributeHandler) {}

  async handle(req: Request, res: MedusaResponse): Promise<void> {
    const exchange_property = await this.handler.handle({
      id: req.params.id,
      attribute_id: req.validatedBody.attribute_id,
    });
    res.json({ exchange_property });
  }
}
