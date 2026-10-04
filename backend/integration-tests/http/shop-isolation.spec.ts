import { createProductCategoriesWorkflow, createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import { EXCHANGE_MODULE } from "../../src/modules/exchange";
import type { ExchangeModuleService } from "../../src/modules/exchange/service/exchange-module-service";
import type { CreatedShopDTO } from "../../src/modules/shop/command/create-shop/dto";

import { adminShopHeaders, waitFor } from "./helpers/auth";

jest.setTimeout(120 * 1000);

type Response = { status: number; data: Record<string, any> };

/**
 * Изоляция магазинов: данные магазина A не видны и не меняются из магазина B (`x-shop-id`) — ни списком, ни по id.
 * Каждый шаг плана дописывает сюда свои сущности.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let a: Record<string, string>;
    let b: Record<string, string>;
    let shopA: CreatedShopDTO;
    let shopB: CreatedShopDTO;

    const call = (request: Promise<unknown>): Promise<Response> =>
      request.then(
        (response) => response as Response,
        (error) => error.response,
      );
    const get = (url: string, headers: Record<string, string>) => call(api.get(url, { headers }));
    const post = (url: string, body: Record<string, unknown>, headers: Record<string, string>) =>
      call(api.post(url, body, { headers }));
    const remove = (url: string, headers: Record<string, string>) => call(api.delete(url, { headers }));

    const createSupplier = async (name: string, headers: Record<string, string>) => {
      const { data } = await post(
        "/admin/suppliers",
        {
          name,
          ship_city: "Москва",
          // Закрытый порт: ручной запуск сразу падает — запуск импорта без сети
          exchange: { mode: "pull", urls: ["http://127.0.0.1:9/catalog.xml"] },
        },
        headers,
      );
      await waitFor(async () => (await get(`/admin/suppliers/${data.supplier.id}`, headers)).data.supplier.stock_location_id);
      return data.supplier.id as string;
    };

    beforeEach(async () => {
      [{ headers: a, shop: shopA }, { headers: b, shop: shopB }] = await Promise.all([
        adminShopHeaders(api, getContainer()),
        adminShopHeaders(api, getContainer()),
      ]);
    });

    it("поставщики, бренды, характеристики: списки и карточки только своего магазина, чужие по id — 404", async () => {
      const supplierId = await createSupplier("Альфа", a);
      const brand = (await post("/admin/brands", { name: "Puma" }, a)).data.brand;
      const attribute = (await post("/admin/attributes", { name: "Материал" }, a)).data.attribute;
      await post("/admin/brands", { name: "Reebok" }, b);

      // Списки магазина B — только его
      expect((await get("/admin/suppliers", b)).data.suppliers).toEqual([]);
      expect((await get("/admin/brands", b)).data.brands).toEqual([expect.objectContaining({ name: "Reebok" })]);
      expect((await get("/admin/attributes", b)).data.attributes).toEqual([]);
      expect((await get("/admin/brands", a)).data.brands).toEqual([expect.objectContaining({ name: "Puma" })]);

      // По id из чужого магазина — 404 на чтение, изменение, удаление и вложенные роуты
      const foreign = [
        get(`/admin/suppliers/${supplierId}`, b),
        post(`/admin/suppliers/${supplierId}`, { name: "Чужой" }, b),
        remove(`/admin/suppliers/${supplierId}`, b),
        get(`/admin/suppliers/${supplierId}/exchange-groups`, b),
        get(`/admin/suppliers/${supplierId}/exchange-properties`, b),
        get(`/admin/suppliers/${supplierId}/exchange-review`, b),
        post(`/admin/suppliers/${supplierId}/import-runs`, {}, b),
        get(`/admin/brands/${brand.id}`, b),
        post(`/admin/brands/${brand.id}`, { name: "Чужой" }, b),
        remove(`/admin/brands/${brand.id}`, b),
        post(`/admin/attributes/${attribute.id}`, { name: "Чужая" }, b),
        remove(`/admin/attributes/${attribute.id}`, b),
      ];
      for (const response of await Promise.all(foreign)) expect(response.status).toBe(404);

      // Ничего не изменилось и не удалилось
      expect((await get(`/admin/suppliers/${supplierId}`, a)).data.supplier.name).toBe("Альфа");
      expect((await get(`/admin/brands/${brand.id}`, a)).data.brand.name).toBe("Puma");

      // Без магазина — 400: разделу нужен текущий магазин
      const { "x-shop-id": _shop, ...noShop } = a;
      expect((await get("/admin/suppliers", noShop)).status).toBe(400);
      expect((await get(`/admin/brands/${brand.id}`, noShop)).status).toBe(400);
      expect((await post("/admin/attributes", { name: "Цвет" }, noShop)).status).toBe(400);
    });

    it("импорт: запуски, группы и свойства поставщика — только из его магазина; характеристика — только своего", async () => {
      const supplierId = await createSupplier("Альфа", a);
      const run = (await post(`/admin/suppliers/${supplierId}/import-runs`, {}, a)).data.import_run;
      expect(run.status).toBe("failed");

      const exchange = getContainer().resolve<ExchangeModuleService>(EXCHANGE_MODULE);
      const [group] = await exchange.createExchangeGroups([{ supplier_id: supplierId, external_id: "g-1", name: "Обувь" }]);
      const [property] = await exchange.createExchangeProperties([
        { supplier_id: supplierId, external_id: "p-1", name: "Материал" },
      ]);
      const own = (await post("/admin/attributes", { name: "Материал" }, a)).data.attribute;
      const foreignAttribute = (await post("/admin/attributes", { name: "Материал" }, b)).data.attribute;

      // Свой магазин видит запуск, чужой — нет
      expect((await get("/admin/import-runs", a)).data.import_runs).toEqual([expect.objectContaining({ id: run.id })]);
      expect((await get("/admin/import-runs", b)).data).toEqual(expect.objectContaining({ import_runs: [], count: 0 }));
      expect((await get(`/admin/import-runs?supplier_id=${supplierId}`, b)).data.import_runs).toEqual([]);

      const foreign = [
        get(`/admin/import-runs/${run.id}`, b),
        post(`/admin/import-runs/${run.id}/retry`, {}, b),
        post(`/admin/exchange-groups/${group.id}`, { category_id: null }, b),
        post(`/admin/exchange-properties/${property.id}`, { attribute_id: null }, b),
      ];
      for (const response of await Promise.all(foreign)) expect(response.status).toBe(404);

      // Свойство поставщика A — только на характеристику магазина A
      const wrong = await post(`/admin/exchange-properties/${property.id}`, { attribute_id: foreignAttribute.id }, a);
      expect(wrong.status).toBe(400);
      expect(wrong.data.message).toContain("из другого магазина");
      const mapped = await post(`/admin/exchange-properties/${property.id}`, { attribute_id: own.id }, a);
      expect(mapped.data.exchange_property).toEqual({ id: property.id, attribute_id: own.id });
    });

    it("каталог: блоки карточки товара, предложения и категории — только в магазине товара", async () => {
      const {
        result: [product],
      } = await createProductsWorkflow(getContainer()).run({
        input: {
          products: [
            {
              title: "Утюг",
              status: "draft",
              sales_channels: [{ id: shopA.sales_channel_id ?? "" }],
              options: [{ title: "Размер", values: ["M"] }],
              variants: [{ title: "M", options: { Размер: "M" }, prices: [{ amount: 100, currency_code: "rub" }] }],
            },
          ],
        },
      });
      const supplierId = await createSupplier("Альфа", a);
      const offer = (
        await post(
          "/admin/supplier-offers",
          { supplier_id: supplierId, variant_id: product.variants[0].id, external_id: "o-1", quantity: 1 },
          a,
        )
      ).data.supplier_offer;
      await createProductCategoriesWorkflow(getContainer()).run({
        input: {
          product_categories: [
            { name: "Утюги", is_active: true, parent_category_id: shopA.root_category_id },
            { name: "Чайники", is_active: true, parent_category_id: shopB.root_category_id },
          ],
        },
      });

      // Магазин товара — сетевой роут, без заголовка
      const { "x-shop-id": _shop, ...noShop } = a;
      expect((await get(`/admin/products/${product.id}/shop`, noShop)).data.shop).toEqual(
        expect.objectContaining({ id: shopA.id }),
      );

      // Категории магазина — только его дерево, без корня
      expect((await get("/admin/shops/current/categories", a)).data.product_categories).toEqual([
        expect.objectContaining({ name: "Утюги", parent_category_id: shopA.root_category_id }),
      ]);
      expect((await get("/admin/shops/current/categories", b)).data.product_categories).toEqual([
        expect.objectContaining({ name: "Чайники" }),
      ]);
      expect((await get("/admin/shops/current/categories", noShop)).status).toBe(400);

      // Предложения поставщиков — списком и по id только своего магазина
      expect((await get("/admin/supplier-offers", a)).data.supplier_offers).toEqual([
        expect.objectContaining({ id: offer.id }),
      ]);
      expect((await get("/admin/supplier-offers", b)).data.supplier_offers).toEqual([]);

      const foreign = [
        get(`/admin/products/${product.id}/catalog`, b),
        post(`/admin/products/${product.id}/catalog`, { brand_id: null }, b),
        get(`/admin/products/${product.id}/attributes`, b),
        post(`/admin/products/${product.id}/attributes`, { variant_id: null, values: [] }, b),
        get(`/admin/products/${product.id}/supplier-offers`, b),
        get(`/admin/supplier-offers/${offer.id}`, b),
        post(`/admin/supplier-offers/${offer.id}`, { quantity: 5 }, b),
        remove(`/admin/supplier-offers/${offer.id}`, b),
      ];
      for (const response of await Promise.all(foreign)) expect(response.status).toBe(404);

      expect((await get(`/admin/products/${product.id}/catalog`, a)).status).toBe(200);
      expect((await get(`/admin/supplier-offers/${offer.id}`, a)).data.supplier_offer.quantity).toBe(1);
    });
  },
});
