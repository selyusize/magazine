import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import { type TestShopContext, testShopContext, waitFor } from "./helpers/auth";
import { trackedPath } from "./helpers/redirects";

jest.setTimeout(120 * 1000);

type Rule = { from_path: string; to_path: string | null; code: number };

/**
 * Адреса внутри магазина (план, шаг 5): handle сущностей Medusa хранится с префиксом магазина (`{магазин}ːutyug`),
 * Store API отдаёт и принимает его без префикса, редиректы — свои у каждого магазина.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let a: TestShopContext;
    let b: TestShopContext;

    const query = () => getContainer().resolve(ContainerRegistrationKeys.QUERY);
    const storedHandle = async (entity: string, id: string): Promise<string> =>
      (await query().graph({ entity, fields: ["handle"], filters: { id } })).data[0].handle;
    const resolve = async (shop: TestShopContext, path: string): Promise<Rule | null> =>
      (await api.get(`/store/redirects/resolve?path=${encodeURIComponent(path)}`, { headers: shop.store })).data
        .redirect;

    /**
     * Товар из админки (без handle — Medusa построит из названия). Публикуется напрямую в модуле, когда адрес уже
     * синхронизирован: у опубликованного товара без обязательных полей guard отклонил бы переименование.
     */
    const createProduct = async (shop: TestShopContext, title: string): Promise<string> => {
      const {
        result: [product],
      } = await createProductsWorkflow(getContainer()).run({
        input: {
          products: [
            {
              title,
              status: "draft",
              sales_channels: shop.sales_channels,
              options: [{ title: "Размер", values: ["M"] }],
            },
          ],
        },
      });
      await waitFor(() => trackedPath(getContainer(), product.id));
      // Обязательные поля публикации (шаг 2.6) этому тесту не нужны — статус напрямую в модуле product
      await getContainer().resolve(Modules.PRODUCT).updateProducts(product.id, { status: "published" });
      return product.id;
    };

    beforeEach(async () => {
      [a, b] = await Promise.all([testShopContext(api, getContainer()), testShopContext(api, getContainer())]);
    });

    it("одинаковый товар в двух магазинах: свой handle с префиксом, Store API — без него; 301 только в своём магазине", async () => {
      // Medusa пишет handle из названия без префикса, префикс ставит подписчик: пока он не отработал, тот же handle
      // во втором магазине упрётся в глобальную уникальность Medusa — ждём синхронизации первого
      const productA = await createProduct(a, "Утюг Philips");
      const productB = await createProduct(b, "Утюг Philips");
      expect(await storedHandle("product", productA)).toBe(`${a.shop.slug}ːutyug-philips`);
      expect(await storedHandle("product", productB)).toBe(`${b.shop.slug}ːutyug-philips`);

      // Store API: фильтр и ответ — handle витрины, каждый ключ видит свой товар
      const cases: [TestShopContext, string][] = [
        [a, productA],
        [b, productB],
      ];
      for (const [shop, id] of cases) {
        const { data } = await api.get("/store/products?handle=utyug-philips&fields=id,handle", {
          headers: shop.store,
        });
        expect(data.products).toEqual([{ id, handle: "utyug-philips" }]);
      }

      // Админ меняет адрес в магазине A — как в форме Medusa, без префикса: синхронизация вернёт префикс. На время
      // смены — черновик: опубликованному товару без обязательных полей guard не дал бы переименоваться
      await getContainer().resolve(Modules.PRODUCT).updateProducts(productA, { status: "draft" });
      await updateProductsWorkflow(getContainer()).run({
        input: { selector: { id: productA }, update: { handle: "utyug-philips-azur" } },
      });
      await waitFor(() => resolve(a, "/products/utyug-philips"));
      expect(await storedHandle("product", productA)).toBe(`${a.shop.slug}ːutyug-philips-azur`);
      expect(await resolve(a, "/products/utyug-philips")).toEqual({
        from_path: "/products/utyug-philips",
        to_path: "/products/utyug-philips-azur",
        code: 301,
      });
      // В магазине B страница живая и редиректа нет
      expect(await resolve(b, "/products/utyug-philips")).toBeNull();
      expect((await api.get("/store/redirects", { headers: b.store })).data.redirects).toEqual([]);

      await getContainer().resolve(Modules.PRODUCT).updateProducts(productA, { status: "published" });
      const { data } = await api.get("/store/products?handle=utyug-philips-azur&fields=id,handle", {
        headers: a.store,
      });
      expect(data.products).toEqual([{ id: productA, handle: "utyug-philips-azur" }]);
    });

    it("категории: одинаковый handle в двух деревьях, Store API ищет и отдаёт handle витрины", async () => {
      const create = async (shop: TestShopContext) =>
        (
          await createProductCategoriesWorkflow(getContainer()).run({
            input: {
              product_categories: [
                { name: "Бытовая техника", is_active: true, parent_category_id: shop.root_category_id },
              ],
            },
          })
        ).result[0].id;
      const categoryA = await create(a);
      await waitFor(async () => (await trackedPath(getContainer(), categoryA)) === "/catalog/bytovaya-tehnika");
      const categoryB = await create(b);
      await waitFor(async () => (await trackedPath(getContainer(), categoryB)) === "/catalog/bytovaya-tehnika");

      const { data } = await api.get(
        "/store/product-categories?handle=bytovaya-tehnika&fields=id,handle,parent_category.handle",
        { headers: b.store },
      );
      expect(data.product_categories).toEqual([
        expect.objectContaining({
          id: categoryB,
          handle: "bytovaya-tehnika",
          parent_category: expect.objectContaining({ handle: "catalog" }),
        }),
      ]);
    });
  },
});
