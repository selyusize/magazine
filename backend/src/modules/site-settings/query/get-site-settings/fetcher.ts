import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import type { SiteSettingsDTO } from "./dto";
import type { GetSiteSettingsQuery } from "./query";

/**
 * Моковые реквизиты, пока их негде редактировать. Когда появится хранилище (своя таблица модуля
 * и форма в админке), fetch() начнёт читать через this.graph, а контракт ответа останется прежним.
 */
const MOCK_SITE_SETTINGS: SiteSettingsDTO = {
  name: "Олиса",
  domain: "olisa.ru",
  url: "https://olisa.ru",
  legal: {
    name: "ООО «Олиса»",
    inn: "7700000000",
    ogrn: "1027700000000",
    kpp: "770001001",
    address: "123112, г. Москва, Пресненская наб., д. 1, офис 1",
  },
  contacts: {
    phone: "+78000000000",
    email: "info@olisa.ru",
    working_hours: "Ежедневно с 9:00 до 21:00 (МСК)",
  },
  address: {
    country_code: "RU",
    postal_code: "123112",
    city: "Москва",
    street: "Пресненская наб., д. 1, офис 1",
  },
  social_links: [
    { name: "ВКонтакте", url: "https://vk.com/olisa" },
    { name: "Telegram", url: "https://t.me/olisa" },
  ],
};

/** Реквизиты и контакты магазина для витрины — GET /store/site-settings. */
@Injectable()
export class GetSiteSettingsFetcher extends AbstractFetcher<
  GetSiteSettingsQuery,
  SiteSettingsDTO
> {
  async fetch(_query: GetSiteSettingsQuery): Promise<SiteSettingsDTO> {
    return MOCK_SITE_SETTINGS;
  }
}
