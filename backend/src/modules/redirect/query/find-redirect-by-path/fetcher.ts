import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import { normalizePath } from "../../service/path";
import type { RedirectRuleDTO } from "./dto";
import type { FindRedirectByPathQuery } from "./query";

export const REDIRECT_RULE_FIELDS = ["from_path", "to_path", "code"];

export const toRedirectRuleDTO = (
  redirect: RedirectRuleDTO,
): RedirectRuleDTO => ({
  from_path: redirect.from_path,
  to_path: redirect.to_path,
  code: redirect.code,
});

/** Правило магазина для пути или `null` — GET /store/redirects/resolve. */
@Injectable()
export class FindRedirectByPathFetcher extends AbstractFetcher<
  FindRedirectByPathQuery,
  RedirectRuleDTO | null
> {
  async fetch(query: FindRedirectByPathQuery): Promise<RedirectRuleDTO | null> {
    const { data } = await this.graph({
      entity: "redirect",
      fields: REDIRECT_RULE_FIELDS,
      filters: { shop_id: query.shop_id, from_path: normalizePath(query.path) },
    });
    return data[0] ? toRedirectRuleDTO(data[0]) : null;
  }
}
