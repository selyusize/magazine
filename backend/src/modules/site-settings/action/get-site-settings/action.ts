import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetSiteSettingsFetcher } from "../../query/get-site-settings/fetcher";

/** Отдаёт реквизиты магазина витрине: Organization в schema.org и подвал. */
@Injectable()
export class GetSiteSettingsAction implements Action {
  constructor(private readonly fetcher: GetSiteSettingsFetcher) {}

  async handle(_req: MedusaRequest, res: MedusaResponse): Promise<void> {
    const siteSettings = await this.fetcher.fetch({});
    res.json({ site_settings: siteSettings });
  }
}
