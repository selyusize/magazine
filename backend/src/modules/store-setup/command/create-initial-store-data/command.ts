/** Общая настройка сети при первом запуске: валюта, регион, налоги, доставка. Магазины — `create-shop`. */
export type CreateInitialStoreDataCommand = {
  store_name: string;
  /** ISO 4217 в нижнем регистре: `rub`. */
  currency_code: string;
  region_name: string;
  /** ISO 3166-1 alpha-2 в нижнем регистре: `ru`. */
  country_code: string;
  /** Цены в регионе и валюте уже включают налог (для РФ — НДС). */
  is_tax_inclusive: boolean;
  tax_rate: {
    name: string;
    code: string;
    /** Процент: `22` — это 22 %. */
    rate: number;
  };
  shipping: {
    /**
     * Склад отгрузки: от его города перевозчики считают тариф. Пока способы доставки не перенесены на склады
     * поставщиков (план, шаг 30) — один общий склад, `create-shop` открывает его каналу каждого магазина.
     */
    origin: {
      name: string;
      city: string;
      address_1: string;
      postal_code: string;
    };
    /** Зона доставки — вся страна `country_code`. */
    zone_name: string;
    /** Способы доставки с тарифом от перевозчика; `option_id` — из getFulfillmentOptions провайдера. */
    options: {
      name: string;
      description: string;
      provider_id: string;
      option_id: string;
    }[];
  };
};
