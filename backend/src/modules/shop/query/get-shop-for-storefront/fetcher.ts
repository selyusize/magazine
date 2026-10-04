import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import { records, text } from "@shared/query/narrow";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { parseShopSettings } from "@shared/shop/shop-settings";

import {
  NETWORK_SETTINGS_FIELDS,
  toNetworkSettingsValues,
} from "../../service/network-settings";
import type { StorefrontShopDTO } from "./dto";
import type { GetShopForStorefrontQuery } from "./query";

/**
 * GET /store/shop: данные магазина ключа и реквизиты сети. Без кэша бэкенда: два лёгких запроса, а витрина
 * кэширует ответ у себя (тег `shop`, ревалидация по событию — шаг 7).
 */
@Injectable()
export class GetShopForStorefrontFetcher extends AbstractFetcher<
  GetShopForStorefrontQuery,
  StorefrontShopDTO
> {
  async fetch(query: GetShopForStorefrontQuery): Promise<StorefrontShopDTO> {
    const [{ data: shops }, { data: settings }] = await Promise.all([
      this.graph({
        entity: "shop",
        fields: ["slug", "name", "domain", "storefront_url", "settings"],
        filters: { id: query.shop_id },
      }),
      this.graph({
        entity: "network_settings",
        fields: [...NETWORK_SETTINGS_FIELDS],
        pagination: { take: 1, order: { created_at: "ASC" } },
      }),
    ]);

    const [shop] = records(shops);
    if (!shop)
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Магазин ${query.shop_id} не найден`,
      );

    const { contacts, logo_url } = parseShopSettings(shop.settings);
    const network = toNetworkSettingsValues(records(settings)[0]);
    return {
      slug: text(shop.slug),
      name: text(shop.name),
      domain: text(shop.domain),
      url: text(shop.storefront_url),
      logo_url: logo_url ?? null,
      contacts: {
        phone: contacts?.phone ?? null,
        email: contacts?.email ?? null,
        address: contacts?.address ?? null,
      },
      network: {
        name: network.name,
        legal: {
          name: network.legal_name,
          inn: network.inn,
          ogrn: network.ogrn,
          kpp: network.kpp,
          address: network.legal_address,
        },
        phone: network.phone,
        email: network.email,
      },
    };
  }
}
