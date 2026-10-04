import { Injectable } from "@shared/container";
import { records } from "@shared/query/narrow";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import {
  NETWORK_SETTINGS_FIELDS,
  toNetworkSettingsValues,
} from "../../service/network-settings";
import type { NetworkSettingsDTO } from "./dto";
import type { GetNetworkSettingsQuery } from "./query";

/** Реквизиты сети — GET /admin/network-settings и ответ витрине (`get-shop-for-storefront`). */
@Injectable()
export class GetNetworkSettingsFetcher extends AbstractFetcher<
  GetNetworkSettingsQuery,
  NetworkSettingsDTO
> {
  async fetch(_query: GetNetworkSettingsQuery): Promise<NetworkSettingsDTO> {
    const { data } = await this.graph({
      entity: "network_settings",
      fields: [...NETWORK_SETTINGS_FIELDS],
      pagination: { take: 1, order: { created_at: "ASC" } },
    });
    return toNetworkSettingsValues(records(data)[0]);
  }
}
