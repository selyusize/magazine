import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { deliveryProviders } from "@container/common/delivery";
import { Container } from "@container/index";
import type { CreateInitialStoreDataCommand } from "@domain/store-setup/command/create-initial-store-data/command";
import { CreateInitialStoreDataHandler } from "@domain/store-setup/command/create-initial-store-data/handler";

/** Способы доставки подключённых перевозчиков: провайдер без ключей в medusa-config.ts не регистрируется. */
const SHIPPING_OPTIONS: CreateInitialStoreDataCommand["shipping"]["options"] = [
  ...(deliveryProviders.cdek
    ? [
        {
          name: "СДЭК — пункт выдачи",
          description: "Заберите заказ в пункте выдачи или постамате СДЭК",
          provider_id: "cdek_cdek",
          option_id: "cdek-pickup",
        },
        {
          name: "СДЭК — курьер",
          description: "Курьер СДЭК привезёт заказ по адресу",
          provider_id: "cdek_cdek",
          option_id: "cdek-door",
        },
      ]
    : []),
  ...(deliveryProviders.yandex_delivery
    ? [
        {
          name: "Яндекс Доставка — пункт выдачи",
          description: "Заберите заказ в пункте выдачи Яндекса",
          provider_id: "yandex-delivery_yandex-delivery",
          option_id: "yandex-pickup",
        },
        {
          name: "Яндекс Доставка — курьер",
          description: "Курьер Яндекса привезёт заказ по адресу",
          provider_id: "yandex-delivery_yandex-delivery",
          option_id: "yandex-courier",
        },
      ]
    : []),
];

/** Магазин из коробки — в рублях и для России. С 01.01.2026 базовая ставка НДС — 22 %. */
const INITIAL_STORE_DATA: CreateInitialStoreDataCommand = {
  store_name: "Default Store",
  currency_code: "rub",
  region_name: "Россия",
  country_code: "ru",
  is_tax_inclusive: true,
  tax_rate: { name: "НДС 22%", code: "vat-22", rate: 22 },
  sales_channel_name: "Default Sales Channel",
  publishable_api_key_title: "Default Publishable API Key",
  shipping: {
    // Временный склад, пока нет поставщиков (этап 2): адрес меняется в админке, Settings → Locations
    origin: {
      name: "Отгрузка",
      city: "Москва",
      address_1: "Ленинградский проспект, 27",
      postal_code: "125040",
    },
    zone_name: "Россия",
    options: SHIPPING_OPTIONS,
  },
};

/** Medusa запускает migration-скрипт один раз — при первом `db:migrate`. */
export default async function initialDataSeed({
  container,
}: {
  container: MedusaContainer;
}): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const result = await Container.from(container)
    .get(CreateInitialStoreDataHandler)
    .handle(INITIAL_STORE_DATA);

  logger.info(
    `store-setup/create-initial-store-data: регион ${result.region_id}, канал ${result.sales_channel_id}, ` +
      `publishable key ${result.publishable_api_key}, способов доставки ${result.shipping_option_ids.length}`,
  );
}
