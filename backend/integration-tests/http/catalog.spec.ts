import type { MedusaContainer } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  getVariantAvailability,
} from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import { adminShopHeaders, waitFor } from "./helpers/auth";

jest.setTimeout(120 * 1000);

type Response = { status: number; data: Record<string, any> };

/**
 * Этап 2 плана: поставщики со своими складами, предложения двух поставщиков на одной карточке (наличие — сумма
 * остатков), бренд и основная категория, характеристики, обязательные поля для публикации.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>;
    let salesChannelId: string;
    let rootCategoryId: string;

    const query = () => getContainer().resolve(ContainerRegistrationKeys.QUERY);
    const post = (url: string, body: Record<string, unknown>) =>
      api.post(url, body, { headers: admin }) as Promise<Response>;
    const get = (url: string) =>
      api.get(url, { headers: admin }) as Promise<Response>;
    const fail = (request: Promise<unknown>): Promise<Response> =>
      request.then(
        () => {
          throw new Error("запрос должен был упасть");
        },
        (error) => error.response,
      );

    /** Поставщик и его склад — склад создаёт подписчик. */
    const createSupplier = async (
      body: Record<string, unknown>,
    ): Promise<{ id: string; stock_location_id: string }> => {
      const { data } = await post("/admin/suppliers", body);
      const stock_location_id: string = await waitFor(async () => {
        const { data: one } = await get(`/admin/suppliers/${data.supplier.id}`);
        return one.supplier.stock_location_id as string | null;
      });
      return { id: data.supplier.id, stock_location_id };
    };

    /** Черновик с одним вариантом; остатки Medusa считает (`manage_inventory`) — их дадут предложения. */
    const createDraftProduct = async (
      container: MedusaContainer,
      title: string,
    ) => {
      const {
        result: [product],
      } = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title,
              status: "draft",
              sales_channels: [{ id: salesChannelId }],
              options: [{ title: "Размер", values: ["M"] }],
              variants: [
                {
                  title: "M",
                  options: { Размер: "M" },
                  manage_inventory: true,
                  prices: [{ amount: 1990, currency_code: "rub" }],
                },
              ],
            },
          ],
        },
      });
      return { id: product.id, variant_id: product.variants[0].id };
    };

    const availability = async (variantId: string): Promise<number> => {
      const result = await getVariantAvailability(query(), {
        variant_ids: [variantId],
        sales_channel_id: salesChannelId,
      });
      return result[variantId].availability ?? 0;
    };

    const createCategory = async (handle: string): Promise<string> => {
      const {
        result: [category],
      } = await createProductCategoriesWorkflow(getContainer()).run({
        input: {
          product_categories: [
            { name: handle, handle, is_active: true, parent_category_id: rootCategoryId },
          ],
        },
      });
      return category.id;
    };

    beforeEach(async () => {
      // Поставщики, бренды и характеристики — сущности магазина: админ работает в своём магазине
      const { headers, shop } = await adminShopHeaders(api, getContainer());
      admin = headers;
      salesChannelId = shop.sales_channel_id ?? "";
      rootCategoryId = shop.root_category_id;
    });

    it("поставщик получает свой склад в канале продаж своего магазина; переименование и город доходят до склада", async () => {
      const supplier = await createSupplier({
        name: "Альфа",
        ship_city: "Москва",
        ship_address: "ул. Складская, 1",
        assembly_days: 2,
      });

      const location = async () =>
        (
          await query().graph({
            entity: "stock_location",
            fields: [
              "name",
              "address.city",
              "address.address_1",
              "sales_channels.id",
            ],
            filters: { id: supplier.stock_location_id },
          })
        ).data[0];
      expect(await location()).toEqual(
        expect.objectContaining({
          name: "Поставщик «Альфа»",
          address: expect.objectContaining({
            city: "Москва",
            address_1: "ул. Складская, 1",
          }),
          sales_channels: [{ id: salesChannelId }],
        }),
      );

      await post(`/admin/suppliers/${supplier.id}`, {
        name: "Альфа Опт",
        ship_city: "Казань",
      });
      await waitFor(
        async () => (await location()).name === "Поставщик «Альфа Опт»",
      );
      expect((await location()).address?.city).toBe("Казань");

      const { data } = await get("/admin/suppliers?q=альфа");
      expect(data.suppliers).toEqual([
        expect.objectContaining({
          name: "Альфа Опт",
          assembly_days: 2,
          is_active: true,
          stock_location_id: supplier.stock_location_id,
        }),
      ]);
    });

    it("одна карточка — предложения двух поставщиков, наличие равно сумме их остатков", async () => {
      const alpha = await createSupplier({
        name: "Альфа",
        ship_city: "Москва",
      });
      const beta = await createSupplier({ name: "Бета", ship_city: "Тула" });
      const product = await createDraftProduct(getContainer(), "Кеды");

      const offer = async (supplierId: string, quantity: number) =>
        (
          await post("/admin/supplier-offers", {
            supplier_id: supplierId,
            variant_id: product.variant_id,
            external_id: `${supplierId}-kedy#m`,
            barcode: "4600000000017",
            purchase_price: 900,
            quantity,
          })
        ).data.supplier_offer;

      const fromAlpha = await offer(alpha.id, 3);
      expect(fromAlpha).toEqual(
        expect.objectContaining({
          id: expect.stringMatching(/^soff_/),
          supplier: { name: "Альфа" },
          variant: expect.objectContaining({
            title: "M",
            product_id: product.id,
          }),
          purchase_price: 900,
          quantity: 3,
        }),
      );
      await offer(beta.id, 4);
      await waitFor(async () => (await availability(product.variant_id)) === 7);

      const { data } = await get(
        `/admin/products/${product.id}/supplier-offers`,
      );
      expect(
        data.supplier_offers.map(
          (o: { supplier_name: string; quantity: number }) => [
            o.supplier_name,
            o.quantity,
          ],
        ),
      ).toEqual([
        ["Альфа", 3],
        ["Бета", 4],
      ]);

      // Остаток из выгрузки поменялся
      await post(`/admin/supplier-offers/${fromAlpha.id}`, { quantity: 10 });
      await waitFor(
        async () => (await availability(product.variant_id)) === 14,
      );

      // Выключенный поставщик не продаёт, включённый — снова продаёт
      await post(`/admin/suppliers/${beta.id}`, { is_active: false });
      await waitFor(
        async () => (await availability(product.variant_id)) === 10,
      );
      await post(`/admin/suppliers/${beta.id}`, { is_active: true });
      await waitFor(
        async () => (await availability(product.variant_id)) === 14,
      );

      // Удаление предложения и поставщика обнуляет их склад
      await api.delete(`/admin/supplier-offers/${fromAlpha.id}`, {
        headers: admin,
      });
      await waitFor(async () => (await availability(product.variant_id)) === 4);
      await api.delete(`/admin/suppliers/${beta.id}`, { headers: admin });
      await waitFor(async () => (await availability(product.variant_id)) === 0);
    });

    it("предложение: несуществующий вариант — 404, повтор Ид у поставщика — ошибка, поставщик и вариант не меняются", async () => {
      const supplier = await createSupplier({
        name: "Гамма",
        ship_city: "Омск",
      });
      const product = await createDraftProduct(getContainer(), "Носки");
      const body = {
        supplier_id: supplier.id,
        variant_id: product.variant_id,
        external_id: "noski",
      };

      const missing = await fail(
        post("/admin/supplier-offers", {
          ...body,
          variant_id: "variant_missing",
        }),
      );
      expect(missing.status).toBe(404);
      expect(missing.data.message).toContain(
        "Вариант variant_missing не найден",
      );

      const { data } = await post("/admin/supplier-offers", body);
      const duplicate = await fail(post("/admin/supplier-offers", body));
      expect(duplicate.status).toBeGreaterThanOrEqual(400);
      expect(duplicate.status).toBeLessThan(500);

      const moved = await fail(
        post(`/admin/supplier-offers/${data.supplier_offer.id}`, {
          variant_id: "variant_other",
        }),
      );
      expect(moved.status).toBe(400);
    });

    it("бренд и основная категория товара; удаление категории снимает её как основную", async () => {
      const product = await createDraftProduct(getContainer(), "Худи");
      const { data: brand } = await post("/admin/brands", { name: "Найк" });
      const categoryId = await createCategory("hudi");

      const { data } = await post(`/admin/products/${product.id}/catalog`, {
        brand_id: brand.brand.id,
        main_category_id: categoryId,
      });
      expect(data.catalog).toEqual({
        product_id: product.id,
        brand: { id: brand.brand.id, name: "Найк", handle: "nayk" },
        main_category: { id: categoryId, name: "hudi", handle: "hudi" },
        categories: [],
      });

      const { data: brandOnly } = await post(
        `/admin/products/${product.id}/catalog`,
        {
          brand_id: null,
        },
      );
      expect(brandOnly.catalog.brand).toBeNull();
      expect(brandOnly.catalog.main_category?.id).toBe(categoryId);

      const missing = await fail(
        post(`/admin/products/${product.id}/catalog`, {
          brand_id: "brand_missing",
        }),
      );
      expect(missing.status).toBe(404);

      await api.delete(`/admin/product-categories/${categoryId}`, {
        headers: admin,
      });
      await waitFor(
        async () =>
          (await get(`/admin/products/${product.id}/catalog`)).data.catalog
            .main_category === null,
      );
    });

    it("характеристики: код из названия, значения по типу, замена целиком", async () => {
      const product = await createDraftProduct(getContainer(), "Чайник");
      const { data: material } = await post("/admin/attributes", {
        name: "Материал корпуса",
        is_filterable: true,
      });
      expect(material.attribute).toEqual(
        expect.objectContaining({
          handle: "material-korpusa",
          type: "string",
          is_filterable: true,
          is_visible: true,
        }),
      );
      const { data: power } = await post("/admin/attributes", {
        name: "Мощность",
        type: "number",
        unit: "Вт",
        rank: 1,
      });

      const set = (values: { attribute_id: string; value: string }[]) =>
        post(`/admin/products/${product.id}/attributes`, { values });

      const { data } = await set([
        { attribute_id: power.attribute.id, value: "2 200" },
        { attribute_id: material.attribute.id, value: "Нержавеющая сталь" },
        { attribute_id: material.attribute.id, value: "Стекло" },
      ]);
      expect(
        data.attribute_values.map(
          (v: {
            attribute: { handle: string };
            value: string;
            handle: string;
            number: number | null;
          }) => [v.attribute.handle, v.value, v.handle, v.number],
        ),
      ).toEqual([
        [
          "material-korpusa",
          "Нержавеющая сталь",
          "nerzhaveyuschaya-stal",
          null,
        ],
        ["material-korpusa", "Стекло", "steklo", null],
        ["moschnost", "2200", "2200", 2200],
      ]);

      const { data: replaced } = await set([
        { attribute_id: material.attribute.id, value: "Стекло" },
      ]);
      expect(replaced.attribute_values).toHaveLength(1);

      const invalid = await fail(
        set([{ attribute_id: power.attribute.id, value: "много" }]),
      );
      expect(invalid.status).toBe(400);
      expect(invalid.data.message).toContain("«Мощность»: «много» — не число");
      expect(
        (await get(`/admin/products/${product.id}/attributes`)).data
          .attribute_values,
      ).toHaveLength(1);
    });

    it("публикация требует категорию, фото, цену и предложение; иначе 400 и товар остаётся черновиком", async () => {
      const product = await createDraftProduct(getContainer(), "Рюкзак");
      const publish = () =>
        post(`/admin/products/${product.id}`, { status: "published" });

      const rejected = await fail(publish());
      expect(rejected.status).toBe(400);
      expect(rejected.data.message).toContain(
        "«Рюкзак» — нет: основная категория, изображение, предложение поставщика",
      );
      const { data: draft } = await get(
        `/admin/products/${product.id}?fields=status`,
      );
      expect(draft.product.status).toBe("draft");

      const supplier = await createSupplier({
        name: "Дельта",
        ship_city: "Пермь",
      });
      await post("/admin/supplier-offers", {
        supplier_id: supplier.id,
        variant_id: product.variant_id,
        external_id: "ryukzak",
        quantity: 2,
      });
      await post(`/admin/products/${product.id}/catalog`, {
        main_category_id: await createCategory("ryukzaki"),
      });
      await post(`/admin/products/${product.id}`, {
        thumbnail: "https://example.com/ryukzak.jpg",
      });

      const { data } = await publish();
      expect(data.product.status).toBe("published");

      // Опубликованный товар нельзя оставить без обязательного
      const noImage = await fail(
        post(`/admin/products/${product.id}`, { thumbnail: null }),
      );
      expect(noImage.status).toBe(400);
    });
  },
});
