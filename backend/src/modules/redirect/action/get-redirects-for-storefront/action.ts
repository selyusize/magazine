import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";
import { requireShop } from "@shared/shop/shop-context";

import { GetRedirectsForStorefrontFetcher } from "../../query/get-redirects-for-storefront/fetcher";

/** Вся таблица правил магазина ключа — для его витрины. */
@Injectable()
export class GetRedirectsForStorefrontAction implements Action {
  constructor(private readonly fetcher: GetRedirectsForStorefrontFetcher) {}

  async handle(req: MedusaRequest, res: MedusaResponse): Promise<void> {
    const redirects = await this.fetcher.fetch({ shop_id: requireShop(req).id });
    res.json({ redirects });
  }
}
