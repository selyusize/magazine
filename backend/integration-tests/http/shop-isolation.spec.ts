import { Modules } from "@medusajs/framework/utils";
import {
  createCollectionsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
} from "@medusajs/medusa/core-flows";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import { EXCHANGE_MODULE } from "../../src/modules/exchange";
import type { ExchangeModuleService } from "../../src/modules/exchange/service/exchange-module-service";
import type { CreatedShopDTO } from "../../src/modules/shop/command/create-shop/dto";
import { toStoredHandle } from "../../src/shared/shop/shop-handle";

import { adminShopHeaders, waitFor } from "./helpers/auth";
import { trackedPath } from "./helpers/redirects";
import { buildProductIndex } from "./helpers/search";

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

    it("статьи, посадочные и редиректы: списки только своего магазина, чужие по id — 404, витрина видит только свои правила", async () => {
      const article = (await post("/admin/articles", { title: "Как выбрать утюг" }, a)).data.article;
      const {
        result: [category],
      } = await createProductCategoriesWorkflow(getContainer()).run({
        input: {
          product_categories: [{ name: "Утюги", is_active: true, parent_category_id: shopA.root_category_id }],
        },
      });
      const page = (await post("/admin/filter-pages", { category_id: category.id, title: "Philips" }, a)).data
        .filter_page;
      const redirect = (await post("/admin/redirects", { from_path: "/old", to_path: "/new", code: 301 }, a)).data
        .redirect;
      // Те же адреса в магазине B — свои, не конфликтуют
      expect((await post("/admin/articles", { title: "Как выбрать утюг" }, b)).data.article.handle).toBe(article.handle);
      await post("/admin/redirects", { from_path: "/old", to_path: "/other", code: 302 }, b);

      expect((await get("/admin/articles", b)).data.articles).toHaveLength(1);
      expect((await get("/admin/filter-pages", b)).data.filter_pages).toEqual([]);
      expect((await get("/admin/redirects", b)).data.redirects).toEqual([
        expect.objectContaining({ from_path: "/old", to_path: "/other" }),
      ]);

      const foreign = [
        get(`/admin/articles/${article.id}`, b),
        post(`/admin/articles/${article.id}`, { title: "Чужая" }, b),
        remove(`/admin/articles/${article.id}`, b),
        get(`/admin/filter-pages/${page.id}`, b),
        post(`/admin/filter-pages/${page.id}`, { title: "Чужая" }, b),
        remove(`/admin/filter-pages/${page.id}`, b),
        remove(`/admin/redirects/${redirect.id}`, b),
      ];
      for (const response of await Promise.all(foreign)) expect(response.status).toBe(404);

      const storeOf = (shop: CreatedShopDTO) => ({ "x-publishable-api-key": shop.publishable_api_key ?? "" });
      const resolve = async (shop: CreatedShopDTO) =>
        (await get("/store/redirects/resolve?path=/old", storeOf(shop))).data.redirect;
      expect(await resolve(shopA)).toEqual({ from_path: "/old", to_path: "/new", code: 301 });
      expect(await resolve(shopB)).toEqual({ from_path: "/old", to_path: "/other", code: 302 });
      expect((await get("/store/redirects", storeOf(shopA))).data.redirects).toEqual([
        { from_path: "/old", to_path: "/new", code: 301 },
      ]);
    });

    it("витрина: товары, поиск, категории, коллекции и корзины — только магазина ключа, чужие по id — 404", async () => {
      const storeOf = (shop: CreatedShopDTO) => ({ "x-publishable-api-key": shop.publishable_api_key ?? "" });
      const [storeA, storeB] = [storeOf(shopA), storeOf(shopB)];

      /** Опубликованный товар магазина: статус — напрямую в модуле, когда адрес синхронизирован (см. shop-handles). */
      const createProduct = async (shop: CreatedShopDTO, title: string): Promise<string> => {
        const {
          result: [product],
        } = await createProductsWorkflow(getContainer()).run({
          input: {
            products: [
              {
                title,
                status: "draft",
                sales_channels: [{ id: shop.sales_channel_id ?? "" }],
                options: [{ title: "Размер", values: ["M"] }],
                variants: [{ title: "M", options: { Размер: "M" }, prices: [{ amount: 100, currency_code: "rub" }] }],
              },
            ],
          },
        });
        await waitFor(() => trackedPath(getContainer(), product.id));
        await getContainer().resolve(Modules.PRODUCT).updateProducts(product.id, { status: "published" });
        return product.id;
      };
      const productA = await createProduct(shopA, "Утюг Альфа");
      const productB = await createProduct(shopB, "Чайник Бета");

      const {
        result: [categoryA, categoryB],
      } = await createProductCategoriesWorkflow(getContainer()).run({
        input: {
          product_categories: [
            { name: "Утюги", is_active: true, parent_category_id: shopA.root_category_id },
            { name: "Чайники", is_active: true, parent_category_id: shopB.root_category_id },
          ],
        },
      });
      const {
        result: [collectionA, collectionB],
      } = await createCollectionsWorkflow(getContainer()).run({
        input: {
          collections: [
            { title: "Лето", handle: toStoredHandle({ shop: shopA.slug, handle: "leto" }) },
            { title: "Зима", handle: toStoredHandle({ shop: shopB.slug, handle: "zima" }) },
          ],
        },
      });
      await waitFor(() => trackedPath(getContainer(), categoryA.id));
      await waitFor(() => trackedPath(getContainer(), categoryB.id));

      const ids = (rows: { id: string }[]) => rows.map((row) => row.id);

      // Товары: Medusa ограничивает каналом ключа
      expect(ids((await get("/store/products?fields=id", storeB)).data.products)).toEqual([productB]);
      expect((await get(`/store/products/${productA}`, storeB)).status).toBe(404);
      expect((await get(`/store/products/${productA}`, storeA)).status).toBe(200);

      // Поиск: индекс сужен до каналов ключа
      await buildProductIndex(getContainer());
      const search = async (store: Record<string, string>) =>
        ids((await post("/store/search", { entity: "product", fields: ["id"] }, store)).data.results[0].hits);
      await waitFor(async () => (await search(storeA)).includes(productA));
      await waitFor(async () => (await search(storeB)).includes(productB));
      expect(await search(storeA)).not.toContain(productB);
      expect(await search(storeB)).not.toContain(productA);

      // Категории: свои — с корнем дерева, чужие по id — 404
      const categoriesB = ids((await get("/store/product-categories?fields=id&limit=100", storeB)).data.product_categories);
      expect(categoriesB).toEqual(expect.arrayContaining([categoryB.id, shopB.root_category_id]));
      expect(categoriesB).not.toContain(categoryA.id);
      expect(categoriesB).not.toContain(shopA.root_category_id);
      expect((await get(`/store/product-categories/${categoryA.id}`, storeB)).status).toBe(404);
      expect((await get(`/store/product-categories/${categoryB.id}`, storeB)).data.product_category.id).toBe(categoryB.id);

      // Коллекции
      expect(ids((await get("/store/collections?fields=id", storeA)).data.collections)).toEqual([collectionA.id]);
      expect((await get(`/store/collections/${collectionB.id}`, storeA)).status).toBe(404);
      expect((await get(`/store/collections/${collectionA.id}`, storeA)).data.collection.handle).toBe("leto");

      // Корзина магазина A по ключу B не видна (регион сетевой — один на все магазины)
      const {
        result: [region],
      } = await createRegionsWorkflow(getContainer()).run({
        input: { regions: [{ name: "Россия", currency_code: "rub", countries: ["ru"] }] },
      });
      const cart = (await post("/store/carts", { region_id: region.id }, storeA)).data.cart;
      expect((await get(`/store/carts/${cart.id}`, storeA)).status).toBe(200);
      expect((await get(`/store/carts/${cart.id}`, storeB)).status).toBe(404);
      expect((await post(`/store/carts/${cart.id}`, { email: "x@test.local" }, storeB)).status).toBe(404);
    });

    it("канал продаж: товары списком к каналу не привязываются — товар живёт в одном магазине", async () => {
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
            },
          ],
        },
      });
      const { "x-shop-id": _shop, ...admin } = a;
      const response = await post(
        `/admin/sales-channels/${shopB.sales_channel_id}/products`,
        { add: [product.id] },
        admin,
      );
      expect(response.status).toBe(400);
      expect(response.data.message).toContain("ровно в одном канале");
    });

    it("ревалидация витрины: журнал и секрет вебхука — только своего магазина", async () => {
      await post("/admin/storefront-revalidations", {}, a);
      const journalA = (await get("/admin/storefront-revalidations", a)).data.storefront_revalidations;
      const journalB = (await get("/admin/storefront-revalidations", b)).data.storefront_revalidations;
      const idsA = journalA.map((row: { id: string }) => row.id);
      expect(idsA.length).toBeGreaterThan(0);
      expect(journalB.map((row: { id: string }) => row.id)).not.toEqual(expect.arrayContaining(idsA));

      const secretA = (await get("/admin/shops/current/revalidate-secret", a)).data.storefront_webhook;
      const secretB = (await get("/admin/shops/current/revalidate-secret", b)).data.storefront_webhook;
      expect(secretA.revalidate_secret).not.toBe(secretB.revalidate_secret);
      expect(secretA.revalidate_url).toBe(`${shopA.storefront_url}/api/revalidate`);
    });
  },
});
