import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import initialDataSeed from "../../src/migration-scripts/initial-data-seed";

jest.setTimeout(120 * 1000);

type ShippingOption = {
  id: string;
  name: string;
  price_type: string;
  data: { id: string };
};

/** Перевозчики в тестах — ключи-пустышки (integration-tests/setup.js): проверяем всё, что не требует сети. */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let headers: Record<string, string>;
    let cartId: string;

    beforeEach(async () => {
      await initialDataSeed({ container: getContainer() });

      const query = getContainer().resolve(ContainerRegistrationKeys.QUERY);
      // Medusa при старте создаёт свои канал и ключ с теми же названиями — берём те, что у склада сида
      const { data: locations } = await query.graph({
        entity: "stock_location",
        fields: ["sales_channels.id"],
        filters: { name: "Отгрузка" },
      });
      const salesChannelId = locations[0].sales_channels![0]!.id;
      const { data: keys } = await query.graph({
        entity: "api_key",
        fields: ["token", "sales_channels.id"],
      });
      const { data: regions } = await query.graph({
        entity: "region",
        fields: ["id"],
      });
      headers = {
        "x-publishable-api-key": keys.find((key) =>
          key.sales_channels?.some((channel) => channel?.id === salesChannelId),
        )!.token,
      };

      // Способы доставки подбираются по профилям доставки товаров — нужна корзина с товаром
      const { data: channels } = await query.graph({
        entity: "sales_channel",
        fields: ["id", "name"],
      });
      const { data: profiles } = await query.graph({
        entity: "shipping_profile",
        fields: ["id"],
      });
      const {
        result: [product],
      } = await createProductsWorkflow(getContainer()).run({
        input: {
          products: [
            {
              title: "Футболка",
              status: "draft",
              shipping_profile_id: profiles[0].id,
              sales_channels: [
                {
                  id: channels.find(
                    (channel) => channel.name === "Default Sales Channel",
                  )!.id,
                },
              ],
              options: [{ title: "Размер", values: ["M"] }],
              variants: [
                {
                  title: "M",
                  options: { Размер: "M" },
                  manage_inventory: false,
                  prices: [{ amount: 1500, currency_code: "rub" }],
                },
              ],
            },
          ],
        },
      });

      // Корзина берёт только опубликованные товары, а публикацию через workflow проверяет хук обязательных полей
      // (категория, фото, поставщик) — для теста доставки они не нужны, публикуем напрямую в модуле
      await getContainer()
        .resolve(Modules.PRODUCT)
        .updateProducts(product.id, { status: "published" });

      const { data } = await api.post(
        "/store/carts",
        { region_id: regions[0].id },
        { headers },
      );
      cartId = data.cart.id;
      await api.post(
        `/store/carts/${cartId}/line-items`,
        { variant_id: product.variants[0].id, quantity: 1 },
        { headers },
      );
    });

    const shippingOptions = async (): Promise<ShippingOption[]> =>
      (await api.get(`/store/shipping-options?cart_id=${cartId}`, { headers }))
        .data.shipping_options;

    const calculate = (
      option: ShippingOption,
      data: Record<string, unknown> = {},
    ) =>
      api
        .post(
          `/store/shipping-options/${option.id}/calculate`,
          { cart_id: cartId, data },
          { headers },
        )
        .catch((error) => error.response);

    const setAddress = (address: Record<string, string>) =>
      api.post(
        `/store/carts/${cartId}`,
        { shipping_address: { country_code: "ru", ...address } },
        { headers },
      );

    it("корзина по России видит способы СДЭК и Яндекса с расчётом тарифа", async () => {
      await setAddress({ city: "Казань", address_1: "ул. Баумана, 1" });

      const options = await shippingOptions();
      expect(options.map((option) => option.data.id).sort()).toEqual([
        "cdek-door",
        "cdek-pickup",
        "yandex-courier",
        "yandex-pickup",
      ]);
      expect(
        options.every((option) => option.price_type === "calculated"),
      ).toBe(true);
    });

    it("объясняет покупателю, чего не хватает для расчёта", async () => {
      await setAddress({ city: "", address_1: "" });
      const options = await shippingOptions();
      const byId = (id: string) =>
        options.find((option) => option.data.id === id)!;

      const noCity = await calculate(byId("cdek-pickup"));
      expect(noCity.status).toBe(400);
      expect(noCity.data.message).toBe("Укажите город доставки");

      const noPoint = await calculate(byId("yandex-pickup"));
      expect(noPoint.status).toBe(400);
      expect(noPoint.data.message).toBe(
        "Яндекс Доставка: выберите пункт выдачи",
      );
    });

    it("не добавляет доставку до ПВЗ без выбранного пункта", async () => {
      await setAddress({ city: "Казань", address_1: "ул. Баумана, 1" });
      const option = (await shippingOptions()).find(
        (item) => item.data.id === "yandex-pickup",
      )!;

      const response = await api
        .post(
          `/store/carts/${cartId}/shipping-methods`,
          { option_id: option.id, data: {} },
          { headers },
        )
        .catch((error) => error.response);
      expect(response.status).toBe(400);
      expect(response.data.message).toContain("выберите пункт выдачи");
    });

    it("проверяет запрос пунктов выдачи", async () => {
      const unknown = await api
        .get("/store/delivery/points?provider=post&city=Москва", { headers })
        .catch((error) => error.response);
      expect(unknown.status).toBe(400);

      const noCity = await api
        .get("/store/delivery/points?provider=cdek", { headers })
        .catch((error) => error.response);
      expect(noCity.status).toBe(400);
    });
  },
});
