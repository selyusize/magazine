import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";
import { requireShop } from "@shared/shop/shop-context";

import { FindRedirectByPathFetcher } from "../../query/find-redirect-by-path/fetcher";
import type { FindRedirectByPathParams } from "./schema";

/** Правило магазина ключа для одного пути: `{ redirect: null }`, если редиректа нет — это не ошибка. */
@Injectable()
export class FindRedirectByPathAction implements Action<
  MedusaRequest<unknown, FindRedirectByPathParams>
> {
  constructor(private readonly fetcher: FindRedirectByPathFetcher) {}

  async handle(
    req: MedusaRequest<unknown, FindRedirectByPathParams>,
    res: MedusaResponse,
  ): Promise<void> {
    const redirect = await this.fetcher.fetch({
      shop_id: requireShop(req).id,
      path: req.validatedQuery.path,
    });
    res.json({ redirect });
  }
}
