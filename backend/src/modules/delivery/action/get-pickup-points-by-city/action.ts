import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetPickupPointsByCityFetcher } from "../../query/get-pickup-points-by-city/fetcher";
import type { GetPickupPointsByCityParams } from "./schema";

/** ПВЗ перевозчика в городе — для карты при выборе доставки. */
@Injectable()
export class GetPickupPointsByCityAction implements Action<
  MedusaRequest<unknown, GetPickupPointsByCityParams>
> {
  constructor(private readonly fetcher: GetPickupPointsByCityFetcher) {}

  async handle(
    req: MedusaRequest<unknown, GetPickupPointsByCityParams>,
    res: MedusaResponse,
  ): Promise<void> {
    const points = await this.fetcher.fetch({
      provider: req.validatedQuery.provider,
      city: req.validatedQuery.city,
    });
    res.json({ points });
  }
}
