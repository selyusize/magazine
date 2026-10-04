import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  updateProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import { EXCHANGE_MODULE } from "../../src/modules/exchange";
import type { ExchangeModuleService } from "../../src/modules/exchange/service/exchange-module-service";
import type { CreatedShopDTO } from "../../src/modules/shop/command/create-shop/dto";

import { adminShopHeaders } from "./helpers/auth";

jest.setTimeout(120 * 1000);

type Response = { status: number; data: Record<string, any> };

/**
 * План, шаг 4: у каждого магазина своё дерево категорий и свои справочники, перекрёстные ссылки невозможны —
 * товар в одном канале магазина, бренд, категории и характеристики только его магазина, handle уникален в магазине.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let a: Record<string, string>;
    let b: Record<string, string>;
    let shopA: CreatedShopDTO;
    let shopB: CreatedShopDTO;

    const query = () => getContainer().resolve(ContainerRegistrationKeys.QUERY);
    const call = (request: Promise<unknown>): Promise<Response> =>
      request.then(
        (response) => response as Response,
        (error) => error.response,
      );
    const get = (url: string, headers: Record<string, string>) => call(api.get(url, { headers }));
    const post = (url: string, body: Record<string, unknown>, headers: Record<string, string>) =>
      call(api.post(url, body, { headers }));

    /** Ошибка хука откатывает workflow, но `run` из теста её не бросает — она в `errors`. */
    const errorsOf = (run: { errors?: { error?: { message?: string } }[] }) =>
      (run.errors ?? []).map((item) => item.error?.message ?? "").join("; ");

    const runCreateProduct = (channels: (string | null)[], title = "Утюг") =>
      createProductsWorkflow(getContainer()).run({
        throwOnError: false,
        input: {
          products: [
            {
              title,
              status: "draft",
              sales_channels: channels.map((id) => ({ id: id ?? "" })),
              options: [{ title: "Размер", values: ["M"] }],
              variants: [{ title: "M", options: { Размер: "M" }, prices: [{ amount: 100, currency_code: "rub" }] }],
            },
          ],
        },
      });
    const createProduct = async (channels: (string | null)[], title?: string) => {
      const run = await runCreateProduct(channels, title);
      expect(errorsOf(run)).toBe("");
      return run.result[0];
    };
    const runCreateCategory = (name: string, parent_category_id: string | null) =>
      createProductCategoriesWorkflow(getContainer()).run({
        throwOnError: false,
        input: { product_categories: [{ name, is_active: true, parent_category_id }] },
      });
    /** Handle категорий Medusa пока общий на сеть (префикс магазина — шаг 5), поэтому названия разные. */
    const createCategory = async (name: string, parent_category_id: string | null) => {
      const run = await runCreateCategory(name, parent_category_id);
      expect(errorsOf(run)).toBe("");
      return run.result[0];
    };
    const categoryShop = async (id: string) =>
      (await query().graph({ entity: "product_category", fields: ["shop.id"], filters: { id } })).data[0]?.shop?.id;
    const productChannels = async (id: string) =>
      (await query().graph({ entity: "product", fields: ["sales_channels.id"], filters: { id } })).data[0]
        ?.sales_channels;

    beforeEach(async () => {
      [{ headers: a, shop: shopA }, { headers: b, shop: shopB }] = await Promise.all([
        adminShopHeaders(api, getContainer()),
        adminShopHeaders(api, getContainer()),
      ]);
    });

    it("товар — ровно в одном канале магазина: без канала или в двух магазинах — ошибка, создание откатывается", async () => {
      expect(errorsOf(await runCreateProduct([]))).toContain("не привязан к магазину");
      expect(errorsOf(await runCreateProduct([shopA.sales_channel_id, shopB.sales_channel_id]))).toContain(
        "не привязан к магазину",
      );
      const { data: leftovers } = await query().graph({ entity: "product", fields: ["id"], filters: { title: "Утюг" } });
      expect(leftovers).toEqual([]);

      // Admin API — тот же хук: 400
      const created = await post(
        "/admin/products",
        { title: "Чайник", status: "draft", options: [{ title: "Размер", values: ["M"] }] },
        a,
      );
      expect(created.status).toBe(400);
      expect(created.data.message).toContain("не привязан к магазину");

      const product = await createProduct([shopA.sales_channel_id]);
      expect(await productChannels(product.id)).toEqual([{ id: shopA.sales_channel_id }]);
    });

    it("бренд, категории и характеристики товара — только из его магазина; чужие — 400", async () => {
      const product = await createProduct([shopA.sales_channel_id]);
      const ownBrand = (await post("/admin/brands", { name: "Philips" }, a)).data.brand;
      const foreignBrand = (await post("/admin/brands", { name: "Philips" }, b)).data.brand;
      const ownCategory = await createCategory("Утюги A", shopA.root_category_id);
      const foreignCategory = await createCategory("Утюги B", shopB.root_category_id);
      const ownAttribute = (await post("/admin/attributes", { name: "Мощность" }, a)).data.attribute;
      const foreignAttribute = (await post("/admin/attributes", { name: "Мощность" }, b)).data.attribute;
      const catalog = `/admin/products/${product.id}/catalog`;
      const attributes = `/admin/products/${product.id}/attributes`;

      const rejected = [
        await post(catalog, { brand_id: foreignBrand.id }, a),
        await post(catalog, { main_category_id: foreignCategory.id }, a),
        await post(attributes, { variant_id: null, values: [{ attribute_id: foreignAttribute.id, value: "2000" }] }, a),
        await post(`/admin/products/${product.id}`, { categories: [{ id: foreignCategory.id }] }, a),
      ];
      for (const response of rejected) {
        expect(response.status).toBe(400);
        expect(response.data.message).toContain("из другого магазина");
      }

      const saved = await post(catalog, { brand_id: ownBrand.id, main_category_id: ownCategory.id }, a);
      expect(saved.data.catalog).toEqual(
        expect.objectContaining({
          brand: expect.objectContaining({ id: ownBrand.id }),
          main_category: expect.objectContaining({ id: ownCategory.id }),
        }),
      );
      const values = await post(
        attributes,
        { variant_id: null, values: [{ attribute_id: ownAttribute.id, value: "2000" }] },
        a,
      );
      expect(values.status).toBe(200);
      expect((await post(`/admin/products/${product.id}`, { categories: [{ id: ownCategory.id }] }, a)).status).toBe(
        200,
      );

      // Перенос товара в канал другого магазина с брендом и категориями прежнего — 400, товар остаётся на месте
      const moved = await post(
        `/admin/products/${product.id}`,
        { sales_channels: [{ id: shopB.sales_channel_id }] },
        a,
      );
      expect(moved.status).toBe(400);
      expect(moved.data.message).toContain("бренд из другого магазина");
      expect(await productChannels(product.id)).toEqual([{ id: shopA.sales_channel_id }]);
    });

    it("одинаковый handle бренда и кода характеристики в двух магазинах; внутри магазина — уникален", async () => {
      const inA = (await post("/admin/brands", { name: "Philips" }, a)).data.brand;
      const inB = (await post("/admin/brands", { name: "Philips" }, b)).data.brand;
      expect([inA.handle, inB.handle]).toEqual(["philips", "philips"]);

      expect((await post("/admin/brands", { name: "Philips" }, a)).data.brand.handle).toBe("philips-2");
      const taken = await post("/admin/brands", { name: "Филипс", handle: "philips" }, a);
      expect(taken.status).toBe(400);

      const attributeA = (await post("/admin/attributes", { name: "Мощность" }, a)).data.attribute;
      const attributeB = (await post("/admin/attributes", { name: "Мощность" }, b)).data.attribute;
      expect(attributeA.handle).toBe(attributeB.handle);
    });

    it("дерево категорий: новая наследует магазин родителя, без родителя и перенос в чужое дерево — ошибка", async () => {
      const irons = await createCategory("Утюги", shopA.root_category_id);
      const steam = await createCategory("С парогенератором", irons.id);
      const kettles = await createCategory("Чайники", shopB.root_category_id);
      expect(await categoryShop(shopA.root_category_id)).toBe(shopA.id);
      expect(await categoryShop(irons.id)).toBe(shopA.id);
      expect(await categoryShop(steam.id)).toBe(shopA.id);
      expect(await categoryShop(kettles.id)).toBe(shopB.id);

      expect(errorsOf(await runCreateCategory("Сирота", null))).toContain("вне дерева магазина");
      const viaAdmin = await post("/admin/product-categories", { name: "Сирота" }, a);
      expect(viaAdmin.status).toBe(400);

      const move = async (parent_category_id: string | null) =>
        errorsOf(
          await updateProductCategoriesWorkflow(getContainer()).run({
            throwOnError: false,
            input: { selector: { id: steam.id }, update: { parent_category_id } },
          }),
        );
      expect(await move(kettles.id)).toContain("нельзя перенести в дерево другого магазина");
      expect(await move(null)).toContain("вне дерева магазина");
      const { data } = await query().graph({
        entity: "product_category",
        fields: ["parent_category_id"],
        filters: { id: steam.id },
      });
      expect(data[0].parent_category_id).toBe(irons.id);

      // Внутри своего дерева — можно
      expect(await move(shopA.root_category_id)).toBe("");
      expect(await categoryShop(steam.id)).toBe(shopA.id);
    });

    it("маппинг группы и предложения поставщика — только категории и товары его магазина", async () => {
      const supplier = (await post("/admin/suppliers", { name: "Альфа", ship_city: "Москва" }, a)).data.supplier;
      const exchange = getContainer().resolve<ExchangeModuleService>(EXCHANGE_MODULE);
      const [group] = await exchange.createExchangeGroups([{ supplier_id: supplier.id, external_id: "g-1", name: "Обувь" }]);
      const own = await createCategory("Обувь A", shopA.root_category_id);
      const foreign = await createCategory("Обувь B", shopB.root_category_id);

      const wrong = await post(`/admin/exchange-groups/${group.id}`, { category_id: foreign.id }, a);
      expect(wrong.status).toBe(400);
      expect(wrong.data.message).toContain("из другого магазина");
      expect((await post(`/admin/exchange-groups/${group.id}`, { category_id: own.id }, a)).data.exchange_group).toEqual({
        id: group.id,
        category_id: own.id,
      });

      const foreignProduct = await createProduct([shopB.sales_channel_id], "Кеды");
      const offer = await post(
        "/admin/supplier-offers",
        { supplier_id: supplier.id, variant_id: foreignProduct.variants[0].id, external_id: "o-1", quantity: 1 },
        a,
      );
      expect(offer.status).toBe(400);
      expect(offer.data.message).toContain("из другого магазина");
      expect((await get("/admin/supplier-offers", a)).data.supplier_offers).toEqual([]);
    });
  },
});
