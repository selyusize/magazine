import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import { Container } from "@container/index";

import initialDataSeed from "../../../migration-scripts/initial-data-seed";
import { CreateInitialStoreDataHandler } from "../command/create-initial-store-data/handler";

jest.setTimeout(60 * 1000);

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    // Тестовый раннер поднимает приложение, и Medusa при старте создаёт свой магазин и канал по умолчанию.
    // В жизни сид идёт раньше (`db:migrate` до `start`), поэтому здесь проверяем свои записи, а не их число.
    describe("create-initial-store-data", () => {
      const graph = (entity: string, fields: string[]) =>
        getContainer()
          .resolve(ContainerRegistrationKeys.QUERY)
          .graph({ entity, fields });

      it("migration-скрипт создаёт магазин RU/RUB с НДС в цене", async () => {
        await initialDataSeed({ container: getContainer() });

        const { data: stores } = await graph("store", [
          "name",
          "default_sales_channel_id",
          "supported_currencies.currency_code",
          "supported_currencies.is_default",
        ]);
        // «НДС в цене» у валюты хранится не в store, а в price preference — проверяем ниже
        const store = stores.find((item) => item.name === "Default Store");
        expect(store?.supported_currencies).toEqual([
          expect.objectContaining({ currency_code: "rub", is_default: true }),
        ]);

        const { data: regions } = await graph("region", [
          "name",
          "currency_code",
          "countries.iso_2",
          "payment_providers.id",
        ]);
        expect(regions).toEqual([
          expect.objectContaining({
            name: "Россия",
            currency_code: "rub",
            countries: [expect.objectContaining({ iso_2: "ru" })],
            payment_providers: [
              expect.objectContaining({ id: "pp_system_default" }),
            ],
          }),
        ]);

        const { data: taxRegions } = await graph("tax_region", [
          "country_code",
          "provider_id",
          "tax_rates.rate",
          "tax_rates.is_default",
        ]);
        expect(taxRegions).toEqual([
          expect.objectContaining({
            country_code: "ru",
            provider_id: "tp_system",
            tax_rates: [
              expect.objectContaining({ rate: 22, is_default: true }),
            ],
          }),
        ]);

        // Цены региона — с налогом: это хранится в price preferences модуля pricing
        const { data: preferences } = await graph("price_preference", [
          "attribute",
          "value",
          "is_tax_inclusive",
        ]);
        expect(preferences).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              attribute: "currency_code",
              value: "rub",
              is_tax_inclusive: true,
            }),
            expect.objectContaining({
              attribute: "region_id",
              is_tax_inclusive: true,
            }),
          ]),
        );

        // Доставка: склад отгрузки в Москве, зона «вся Россия», способы обоих перевозчиков с расчётом тарифа
        const { data: options } = await graph("shipping_option", [
          "name",
          "price_type",
          "provider_id",
          "data",
          "service_zone.geo_zones.country_code",
          "service_zone.fulfillment_set.location.address.city",
        ]);
        expect(options.map((option) => option.data?.id).sort()).toEqual([
          "cdek-door",
          "cdek-pickup",
          "yandex-courier",
          "yandex-pickup",
        ]);
        options.forEach((option) => {
          expect(option.price_type).toBe("calculated");
          expect(option.service_zone.geo_zones).toEqual([
            expect.objectContaining({ country_code: "ru" }),
          ]);
          expect(
            option.service_zone.fulfillment_set.location.address.city,
          ).toBe("Москва");
        });

        // Первый магазин — тем же workflow, что и кнопка в админке: ключ → канал → склад с доставкой
        const { data: shops } = await graph("shop", [
          "slug",
          "root_category_id",
          "sales_channel.id",
          "api_key.token",
          "api_key.sales_channels.id",
        ]);
        const olisa = shops.find((shop) => shop.slug === "olisa");
        expect(olisa?.api_key?.token).toMatch(/^pk_/);
        expect(olisa?.api_key?.sales_channels).toEqual([
          expect.objectContaining({ id: olisa?.sales_channel?.id }),
        ]);

        // Склады поставщиков до шага 3 берут канал по умолчанию — это канал olisa
        const { data: defaults } = await graph("store", [
          "default_sales_channel_id",
        ]);
        expect(defaults.map((item) => item.default_sales_channel_id)).toContain(
          olisa?.sales_channel?.id,
        );

        const { data: locations } = await graph("stock_location", [
          "address.city",
          "sales_channels.id",
        ]);
        const origin = locations.find(
          (location) => location.address?.city === "Москва",
        );
        expect(origin?.sales_channels).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: olisa?.sales_channel?.id }),
          ]),
        );
      });

      it("связывает склад отгрузки с набором доставки и перевозчиками", async () => {
        const result = await Container.from(getContainer())
          .get(CreateInitialStoreDataHandler)
          .handle({
            store_name: "Тест",
            currency_code: "rub",
            region_name: "Россия",
            country_code: "ru",
            is_tax_inclusive: true,
            tax_rate: { name: "НДС 22%", code: "vat-22", rate: 22 },
            shipping: {
              origin: {
                name: "Склад",
                city: "Казань",
                address_1: "ул. Баумана, 1",
                postal_code: "420111",
              },
              zone_name: "Россия",
              options: [
                {
                  name: "СДЭК — ПВЗ",
                  description: "",
                  provider_id: "cdek_cdek",
                  option_id: "cdek-pickup",
                },
              ],
            },
          });

        const { data: stores } = await graph("store", ["id"]);
        expect(stores.map((store) => store.id)).toContain(result.store_id);

        // Без связей склад ↔ набор доставки / провайдер витрина не увидит способов доставки; канал — у create-shop
        const { data: locations } = await graph("stock_location", [
          "id",
          "address.city",
          "fulfillment_sets.service_zones.shipping_options.id",
          "fulfillment_providers.id",
        ]);
        const location = locations.find(
          (item) => item.id === result.stock_location_id,
        );
        expect(location?.address?.city).toBe("Казань");
        expect(location?.fulfillment_providers).toEqual([
          expect.objectContaining({ id: "cdek_cdek" }),
        ]);
        expect(
          location?.fulfillment_sets[0].service_zones[0].shipping_options,
        ).toEqual([{ id: result.shipping_option_ids[0] }]);
      });
    });
  },
});
