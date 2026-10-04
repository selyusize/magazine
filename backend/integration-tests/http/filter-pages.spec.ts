import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import {
  createProductCategoriesWorkflow,
  deleteProductCategoriesWorkflow,
  updateProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows";

import { toStoredHandle } from "../../src/shared/shop/shop-handle";
import { createTestShop, type TestShopContext, testShopContext, waitFor } from "./helpers/auth";
import { trackedPath } from "./helpers/redirects";

jest.setTimeout(120 * 1000);

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let shop: TestShopContext;
    let store: Record<string, string>;
    let admin: Record<string, string>;

    const resolve = async (path: string) =>
      (
        await api.get(
          `/store/redirects/resolve?path=${encodeURIComponent(path)}`,
          { headers: store },
        )
      ).data.redirect;
    /** Категория дерева магазина (`root` — корень другого магазина для проверки 400). */
    const createCategory = async (
      handle: string,
      root: { slug: string; root_category_id: string } = shop.shop,
    ): Promise<string> => {
      const {
        result: [category],
      } = await createProductCategoriesWorkflow(getContainer()).run({
        input: {
          product_categories: [
            {
              name: handle,
              handle: toStoredHandle({ shop: root.slug, handle }),
              is_active: true,
              parent_category_id: root.root_category_id,
            },
          ],
        },
      });
      return category.id;
    };
    const createPage = (body: Record<string, unknown>) =>
      api.post("/admin/filter-pages", body, { headers: admin });

    // Посадочные, их категории и редиректы — в одном магазине
    beforeEach(async () => {
      shop = await testShopContext(api, getContainer());
      ({ store, admin } = shop);
    });

    it("категория — только из дерева текущего магазина, адрес — с handle витрины", async () => {
      const own = await createCategory("krossovki");
      const foreign = await createCategory("krossovki", await createTestShop(getContainer()));

      const created = await createPage({ category_id: own, title: "Nike" });
      expect(created.data.filter_page.category).toEqual({ name: "krossovki", handle: "krossovki" });
      await waitFor(() => trackedPath(getContainer(), created.data.filter_page.id));
      expect(await trackedPath(getContainer(), created.data.filter_page.id)).toBe("/catalog/krossovki/nike");

      const onCreate = await createPage({ category_id: foreign, title: "Nike" }).catch((error) => error.response);
      expect(onCreate.status).toBe(400);
      expect(onCreate.data.message).toContain("из другого магазина");

      const onUpdate = await api
        .post(`/admin/filter-pages/${created.data.filter_page.id}`, { category_id: foreign }, { headers: admin })
        .catch((error) => error.response);
      expect(onUpdate.status).toBe(400);

      const missing = await createPage({ category_id: "pcat_missing", title: "Nike" }).catch((error) => error.response);
      expect(missing.status).toBe(400);
    });

    it("handle уникален внутри категории, а в другой категории может повторяться", async () => {
      const shoes = await createCategory("krossovki");
      const shirts = await createCategory("futbolki");

      const first = await createPage({
        category_id: shoes,
        title: "Nike",
        filters: { brand: ["nike"] },
      });
      expect(first.data.filter_page).toEqual(
        expect.objectContaining({
          handle: "nike",
          category: { name: "krossovki", handle: "krossovki" },
          filters: { brand: ["nike"] },
          is_active: true,
        }),
      );
      expect(
        (await createPage({ category_id: shoes, title: "Nike" })).data
          .filter_page.handle,
      ).toBe("nike-2");
      expect(
        (await createPage({ category_id: shirts, title: "Nike" })).data
          .filter_page.handle,
      ).toBe("nike");

      // Перенос в категорию, где адрес занят, — суффикс
      const moved = await api.post(
        `/admin/filter-pages/${first.data.filter_page.id}`,
        { category_id: shirts },
        { headers: admin },
      );
      expect(moved.data.filter_page).toEqual(
        expect.objectContaining({
          handle: "nike-2",
          category: expect.objectContaining({ handle: "futbolki" }),
        }),
      );

      const list = await api.get(`/admin/filter-pages?category_id=${shoes}`, {
        headers: admin,
      });
      expect(list.data.count).toBe(1);
    });

    it("переименование категории даёт 301 со старых адресов посадочных", async () => {
      const categoryId = await createCategory("kedy");
      const { data } = await createPage({
        category_id: categoryId,
        title: "Converse",
      });
      await waitFor(() => trackedPath(getContainer(), data.filter_page.id));

      await updateProductCategoriesWorkflow(getContainer()).run({
        input: {
          selector: { id: categoryId },
          update: { handle: "kedy-i-snikersy" },
        },
      });

      await waitFor(() => resolve("/catalog/kedy/converse"));
      expect(await resolve("/catalog/kedy/converse")).toEqual({
        from_path: "/catalog/kedy/converse",
        to_path: "/catalog/kedy-i-snikersy/converse",
        code: 301,
      });
    });

    it("удаление категории удаляет её посадочные и закрывает их адреса кодом 410", async () => {
      const categoryId = await createCategory("sandalii");
      const { data } = await createPage({
        category_id: categoryId,
        title: "Teva",
      });
      await waitFor(() => trackedPath(getContainer(), data.filter_page.id));
      await api.post(
        `/admin/filter-pages/${data.filter_page.id}`,
        { handle: "teva-letnie" },
        { headers: admin },
      );
      await waitFor(() => resolve("/catalog/sandalii/teva"));

      await deleteProductCategoriesWorkflow(getContainer()).run({
        input: [categoryId],
      });

      await waitFor(
        async () =>
          (await resolve("/catalog/sandalii/teva-letnie"))?.code === 410,
      );
      expect((await resolve("/catalog/sandalii/teva")).code).toBe(410);
      const list = await api.get(
        `/admin/filter-pages?category_id=${categoryId}`,
        { headers: admin },
      );
      expect(list.data.count).toBe(0);
    });

    it("проверяет фильтры и обязательную категорию", async () => {
      const categoryId = await createCategory("botinki");
      const noCategory = await createPage({ title: "X" }).catch(
        (error) => error.response,
      );
      expect(noCategory.status).toBe(400);
      const badFilters = await createPage({
        category_id: categoryId,
        title: "X",
        filters: { brand: "nike" },
      }).catch((error) => error.response);
      expect(badFilters.status).toBe(400);
    });
  },
});
