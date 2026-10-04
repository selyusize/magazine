import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import type { RedirectRuleDTO } from "../find-redirect-by-path/dto";
import {
  REDIRECT_RULE_FIELDS,
  toRedirectRuleDTO,
} from "../find-redirect-by-path/fetcher";
import type { GetRedirectsForStorefrontQuery } from "./query";

/** Все правила магазина — GET /store/redirects: витрина держит таблицу у себя и редиректит без запроса на каждый путь. */
@Injectable()
export class GetRedirectsForStorefrontFetcher extends AbstractFetcher<
  GetRedirectsForStorefrontQuery,
  RedirectRuleDTO[]
> {
  async fetch(
    query: GetRedirectsForStorefrontQuery,
  ): Promise<RedirectRuleDTO[]> {
    const { data } = await this.graph({
      entity: "redirect",
      fields: REDIRECT_RULE_FIELDS,
      filters: { shop_id: query.shop_id },
      pagination: { order: { from_path: "ASC" } },
    });
    return data.map(toRedirectRuleDTO);
  }
}
