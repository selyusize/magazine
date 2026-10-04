import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetNetworkSettingsFetcher } from "../../query/get-network-settings/fetcher";

/** GET /admin/network-settings — реквизиты сети для формы. */
@Injectable()
export class GetNetworkSettingsAction implements Action {
  constructor(private readonly fetcher: GetNetworkSettingsFetcher) {}

  async handle(_req: MedusaRequest, res: MedusaResponse): Promise<void> {
    res.json({ network_settings: await this.fetcher.fetch({}) });
  }
}
