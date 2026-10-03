import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetRedirectsForAdminFetcher } from "../../query/get-redirects-for-admin/fetcher";
import type { GetRedirectsForAdminParams } from "./schema";

/** Страница правил с поиском — для таблицы в админке. */
@Injectable()
export class GetRedirectsForAdminAction implements Action<
  AuthenticatedMedusaRequest<unknown, GetRedirectsForAdminParams>
> {
  constructor(private readonly fetcher: GetRedirectsForAdminFetcher) {}

  async handle(
    req: AuthenticatedMedusaRequest<unknown, GetRedirectsForAdminParams>,
    res: MedusaResponse,
  ): Promise<void> {
    const { q, limit, offset } = req.validatedQuery;
    const { redirects, count } = await this.fetcher.fetch({
      q: q || undefined,
      limit,
      offset,
    });
    res.json({ redirects, count, limit, offset });
  }
}
