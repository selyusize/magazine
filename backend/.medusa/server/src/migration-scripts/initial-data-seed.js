"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = initialDataSeed;
const utils_1 = require("@medusajs/framework/utils");
const delivery_1 = require("@container/common/delivery");
const index_1 = require("@container/index");
const handler_1 = require("@domain/store-setup/command/create-initial-store-data/handler");
/** Способы доставки подключённых перевозчиков: провайдер без ключей в medusa-config.ts не регистрируется. */
const SHIPPING_OPTIONS = [
    ...(delivery_1.deliveryProviders.cdek
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
    ...(delivery_1.deliveryProviders.yandex_delivery
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
const INITIAL_STORE_DATA = {
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
async function initialDataSeed({ container, }) {
    const logger = container.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
    const result = await index_1.Container.from(container)
        .get(handler_1.CreateInitialStoreDataHandler)
        .handle(INITIAL_STORE_DATA);
    logger.info(`store-setup/create-initial-store-data: регион ${result.region_id}, канал ${result.sales_channel_id}, ` +
        `publishable key ${result.publishable_api_key}, способов доставки ${result.shipping_option_ids.length}`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdGlhbC1kYXRhLXNlZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbWlncmF0aW9uLXNjcmlwdHMvaW5pdGlhbC1kYXRhLXNlZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFvRUEsa0NBY0M7QUFqRkQscURBQXNFO0FBRXRFLHlEQUErRDtBQUMvRCw0Q0FBNkM7QUFFN0MsMkZBQThHO0FBRTlHLDZHQUE2RztBQUM3RyxNQUFNLGdCQUFnQixHQUF5RDtJQUM3RSxHQUFHLENBQUMsNEJBQWlCLENBQUMsSUFBSTtRQUN4QixDQUFDLENBQUM7WUFDRTtnQkFDRSxJQUFJLEVBQUUscUJBQXFCO2dCQUMzQixXQUFXLEVBQUUsbURBQW1EO2dCQUNoRSxXQUFXLEVBQUUsV0FBVztnQkFDeEIsU0FBUyxFQUFFLGFBQWE7YUFDekI7WUFDRDtnQkFDRSxJQUFJLEVBQUUsZUFBZTtnQkFDckIsV0FBVyxFQUFFLHNDQUFzQztnQkFDbkQsV0FBVyxFQUFFLFdBQVc7Z0JBQ3hCLFNBQVMsRUFBRSxXQUFXO2FBQ3ZCO1NBQ0Y7UUFDSCxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ1AsR0FBRyxDQUFDLDRCQUFpQixDQUFDLGVBQWU7UUFDbkMsQ0FBQyxDQUFDO1lBQ0U7Z0JBQ0UsSUFBSSxFQUFFLGdDQUFnQztnQkFDdEMsV0FBVyxFQUFFLHdDQUF3QztnQkFDckQsV0FBVyxFQUFFLGlDQUFpQztnQkFDOUMsU0FBUyxFQUFFLGVBQWU7YUFDM0I7WUFDRDtnQkFDRSxJQUFJLEVBQUUsMEJBQTBCO2dCQUNoQyxXQUFXLEVBQUUseUNBQXlDO2dCQUN0RCxXQUFXLEVBQUUsaUNBQWlDO2dCQUM5QyxTQUFTLEVBQUUsZ0JBQWdCO2FBQzVCO1NBQ0Y7UUFDSCxDQUFDLENBQUMsRUFBRSxDQUFDO0NBQ1IsQ0FBQztBQUVGLDBGQUEwRjtBQUMxRixNQUFNLGtCQUFrQixHQUFrQztJQUN4RCxVQUFVLEVBQUUsZUFBZTtJQUMzQixhQUFhLEVBQUUsS0FBSztJQUNwQixXQUFXLEVBQUUsUUFBUTtJQUNyQixZQUFZLEVBQUUsSUFBSTtJQUNsQixnQkFBZ0IsRUFBRSxJQUFJO0lBQ3RCLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFO0lBQ3ZELGtCQUFrQixFQUFFLHVCQUF1QjtJQUMzQyx5QkFBeUIsRUFBRSw2QkFBNkI7SUFDeEQsUUFBUSxFQUFFO1FBQ1IsaUdBQWlHO1FBQ2pHLE1BQU0sRUFBRTtZQUNOLElBQUksRUFBRSxVQUFVO1lBQ2hCLElBQUksRUFBRSxRQUFRO1lBQ2QsU0FBUyxFQUFFLDRCQUE0QjtZQUN2QyxXQUFXLEVBQUUsUUFBUTtTQUN0QjtRQUNELFNBQVMsRUFBRSxRQUFRO1FBQ25CLE9BQU8sRUFBRSxnQkFBZ0I7S0FDMUI7Q0FDRixDQUFDO0FBRUYsNEVBQTRFO0FBQzdELEtBQUssVUFBVSxlQUFlLENBQUMsRUFDNUMsU0FBUyxHQUdWO0lBQ0MsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxpQ0FBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuRSxNQUFNLE1BQU0sR0FBRyxNQUFNLGlCQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztTQUMzQyxHQUFHLENBQUMsdUNBQTZCLENBQUM7U0FDbEMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFFOUIsTUFBTSxDQUFDLElBQUksQ0FDVCxpREFBaUQsTUFBTSxDQUFDLFNBQVMsV0FBVyxNQUFNLENBQUMsZ0JBQWdCLElBQUk7UUFDckcsbUJBQW1CLE1BQU0sQ0FBQyxtQkFBbUIsdUJBQXVCLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FDMUcsQ0FBQztBQUNKLENBQUMifQ==