import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createCollectionsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import { type TestShopContext, testShopContext, waitFor } from "./helpers/auth";
import { trackedPath } from "./helpers/redirects";

jest.setTimeout(120 * 1000);

type Response = { status: number; data: Record<string, any> };

/**
 * Коллекция магазина (план, шаг 6): связь `shop ↔ product_collection` — из `additional_data.shop_id` при создании или
 * из карточки коллекции в админке (дашборд Medusa создаёт её без магазина). Магазин не меняется, товары — из него.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let a: TestShopContext;
    let b: TestShopContext;

    const call = (request: Promise<unknown>): Promise<Response> =>
      request.then(
        (response) => response as Response,
        (error) => error.response,
      );
    const query = () => getContainer().resolve(ContainerRegistrationKeys.QUERY);
    const collectionRow = async (id: string) =>
      (
        await query().graph({
          entity: "product_collection",
          fields: ["handle", "shop.id"],
          filters: { id },
        })
      ).data[0];
    const createCollection = async (
      title: string,
      additional_data?: Record<string, unknown>,
    ) =>
      (
        await createCollectionsWorkflow(getContainer()).run({
          input: { collections: [{ title }], additional_data },
        })
      ).result[0].id;
    const createProduct = async (
      shop: TestShopContext,
      title: string,
      collection_id?: string,
    ) =>
      await createProductsWorkflow(getContainer()).run({
        input: {
          products: [
            {
              title,
              status: "draft",
              sales_channels: shop.sales_channels,
              collection_id,
              options: [{ title: "Размер", values: ["M"] }],
            },
          ],
        },
        throwOnError: false,
      });
    const ids = (rows: { id: string }[]) => rows.map((row) => row.id);
    /** Карточка коллекции — сетевой роут: дашборд Medusa заголовок магазина не шлёт. */
    const adminNoShop = () => {
      const { "x-shop-id": _shop, ...headers } = a.admin;
      return headers;
    };

    beforeEach(async () => {
      [a, b] = await Promise.all([
        testShopContext(api, getContainer()),
        testShopContext(api, getContainer()),
      ]);
    });

    it("additional_data.shop_id: связь при создании, handle с префиксом, витрина магазина видит коллекцию", async () => {
      const id = await createCollection("Летняя распродажа", {
        shop_id: a.shop.id,
      });
      await waitFor(() => trackedPath(getContainer(), id));

      expect(await collectionRow(id)).toEqual(
        expect.objectContaining({
          handle: `${a.shop.slug}ːletnyaya-rasprodazha`,
          shop: expect.objectContaining({ id: a.shop.id }),
        }),
      );
      expect(await trackedPath(getContainer(), id)).toBe(
        "/collections/letnyaya-rasprodazha",
      );

      const { data } = await api.get(
        "/store/collections?handle=letnyaya-rasprodazha&fields=id,handle",
        {
          headers: a.store,
        },
      );
      expect(data.collections).toEqual([
        { id, handle: "letnyaya-rasprodazha" },
      ]);
      expect(
        (await call(api.get(`/store/collections/${id}`, { headers: b.store })))
          .status,
      ).toBe(404);
    });

    it("из дашборда — без магазина и не видна витринам; магазин выбирают в карточке один раз", async () => {
      const id = await createCollection("Новинки");
      const path = `/admin/collections/${id}/shop`;
      expect(
        (await api.get(path, { headers: adminNoShop() })).data.shop,
      ).toBeNull();
      expect(
        (await api.get("/store/collections?fields=id", { headers: a.store }))
          .data.collections,
      ).toEqual([]);

      const assigned = await api.post(
        path,
        { shop_id: a.shop.id },
        { headers: adminNoShop() },
      );
      expect(assigned.data.shop).toEqual({
        id: a.shop.id,
        slug: a.shop.slug,
        name: a.shop.name,
      });
      await waitFor(() => trackedPath(getContainer(), id));
      expect((await collectionRow(id)).handle).toBe(`${a.shop.slug}ːnovinki`);
      expect(
        ids(
          (await api.get("/store/collections?fields=id", { headers: a.store }))
            .data.collections,
        ),
      ).toEqual([id]);

      // Тот же магазин — без изменений, другой — 400, несуществующие магазин и коллекция — 400 и 404
      expect(
        (
          await call(
            api.post(path, { shop_id: a.shop.id }, { headers: adminNoShop() }),
          )
        ).status,
      ).toBe(200);
      const other = await call(
        api.post(path, { shop_id: b.shop.id }, { headers: adminNoShop() }),
      );
      expect(other.status).toBe(400);
      expect(other.data.message).toContain("магазин коллекции не меняется");
      expect(
        (
          await call(
            api.post(
              path,
              { shop_id: "shop_missing" },
              { headers: adminNoShop() },
            ),
          )
        ).status,
      ).toBe(400);
      expect(
        (
          await call(
            api.post(
              "/admin/collections/pcol_missing/shop",
              { shop_id: a.shop.id },
              { headers: adminNoShop() },
            ),
          )
        ).status,
      ).toBe(404);
      expect(
        (await call(api.post(path, {}, { headers: adminNoShop() }))).status,
      ).toBe(400);
    });

    it("товары коллекции — только её магазина: в карточке товара, списком в коллекцию и при выборе магазина", async () => {
      const own = await createCollection("Утюги", { shop_id: a.shop.id });

      // Товар магазина B в коллекции магазина A — хук товара отклоняет
      const { errors } = await createProduct(b, "Чайник", own);
      expect(errors[0]?.error?.message).toContain(
        "коллекция из другого магазина",
      );

      // Списком в коллекцию: чужой — 400, свой — можно
      const {
        result: [productA],
      } = await createProduct(a, "Утюг");
      const {
        result: [productB],
      } = await createProduct(b, "Чайник");
      const products = (add: string[]) =>
        call(
          api.post(
            `/admin/collections/${own}/products`,
            { add },
            { headers: adminNoShop() },
          ),
        );
      const foreign = await products([productB.id]);
      expect(foreign.status).toBe(400);
      expect(foreign.data.message).toContain("«Чайник»");
      expect((await products([productA.id])).status).toBe(200);

      // Коллекция без магазина с товаром B: выбрать ей магазин A нельзя
      const loose = await createCollection("Без магазина");
      await getContainer()
        .resolve(Modules.PRODUCT)
        .updateProducts(productB.id, { collection_id: loose });
      const assign = await call(
        api.post(
          `/admin/collections/${loose}/shop`,
          { shop_id: a.shop.id },
          { headers: adminNoShop() },
        ),
      );
      expect(assign.status).toBe(400);
      expect(assign.data.message).toContain("товары другого магазина");
      expect(
        (
          await call(
            api.post(
              `/admin/collections/${loose}/shop`,
              { shop_id: b.shop.id },
              { headers: adminNoShop() },
            ),
          )
        ).status,
      ).toBe(200);
    });
  },
});
