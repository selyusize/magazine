import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetRedirectsForStorefrontFetcher } from "../../query/get-redirects-for-storefront/fetcher";

/** Вся таблица правил для витрины. */
@Injectable()
export class GetRedirectsForStorefrontAction implements Action {
  constructor(private readonly fetcher: GetRedirectsForStorefrontFetcher) {}

  async handle(_req: MedusaRequest, res: MedusaResponse): Promise<void> {
    const redirects = await this.fetcher.fetch({});
    res.json({ redirects });
  }
}
