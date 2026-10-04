import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";
import { requireShop } from "@shared/shop/shop-context";

import { GetShopForStorefrontFetcher } from "../../query/get-shop-for-storefront/fetcher";

/** GET /store/shop — магазин ключа и реквизиты сети: подвал витрины и Organization в schema.org. */
@Injectable()
export class GetShopForStorefrontAction implements Action {
  constructor(private readonly fetcher: GetShopForStorefrontFetcher) {}

  async handle(req: MedusaRequest, res: MedusaResponse): Promise<void> {
    const shop = await this.fetcher.fetch({ shop_id: requireShop(req).id });
    res.json({ shop });
  }
}
