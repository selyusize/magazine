import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  deleteProductCategoriesWorkflow,
  deleteProductsWorkflow,
  updateProductsWorkflow,
  updateProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import {
  adminHeaders,
  storeHeaders,
  testCategoryRoot,
  testSalesChannels,
  waitFor,
} from "./helpers/auth";
import { trackedPath } from "./helpers/redirects";

jest.setTimeout(120 * 1000);

type Rule = { from_path: string; to_path: string | null; code: number };

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let store: Record<string, string>;
    let admin: Record<string, string>;

    const rules = async (): Promise<Rule[]> =>
      (await api.get("/store/redirects", { headers: store })).data.redirects;
    const resolve = async (path: string): Promise<Rule | null> =>
      (
        await api.get(
          `/store/redirects/resolve?path=${encodeURIComponent(path)}`,
          { headers: store },
        )
      ).data.redirect;
    const save = (body: Record<string, unknown>) =>
      api.post("/admin/redirects", body, { headers: admin });

    beforeEach(async () => {
      store = await storeHeaders(getContainer());
      admin = await adminHeaders(api, getContainer());
    });

    describe("ручные правила", () => {
      it("нормализует путь и находит правило", async () => {
        await save({
          from_path: "https://olisa.ru/old-page/?utm=1",
          to_path: "/new-page",
          code: 301,
        });

        expect(await resolve("/old-page")).toEqual({
          from_path: "/old-page",
          to_path: "/new-page",
          code: 301,
        });
        expect(await resolve("/old-page/?from=ya")).toEqual(
          expect.objectContaining({ to_path: "/new-page" }),
        );
        expect(await resolve("/unknown")).toBeNull();
      });

      it("схлопывает цепочки в обе стороны", async () => {
        await save({ from_path: "/a", to_path: "/b", code: 301 });
        await save({ from_path: "/b", to_path: "/c", code: 301 });
        await save({ from_path: "/x", to_path: "/a", code: 302 });

        expect(await rules()).toEqual([
          { from_path: "/a", to_path: "/c", code: 301 },
          { from_path: "/b", to_path: "/c", code: 301 },
          { from_path: "/x", to_path: "/c", code: 302 },
        ]);

        await save({ from_path: "/c", to_path: null, code: 410 });
        expect(
          (await rules()).every(
            (rule) => rule.to_path === null && rule.code === 410,
          ),
        ).toBe(true);
      });

      it("не даёт сделать цикл и несогласованное правило", async () => {
        await save({ from_path: "/a", to_path: "/b", code: 301 });

        const loop = await save({
          from_path: "/b",
          to_path: "/a",
          code: 301,
        }).catch((error) => error.response);
        expect(loop.status).toBe(400);

        const gone = await save({
          from_path: "/z",
          to_path: "/y",
          code: 410,
        }).catch((error) => error.response);
        expect(gone.status).toBe(400);
      });

      it("импортирует CSV целиком или сообщает строку с ошибкой", async () => {
        const broken = await api
          .post(
            "/admin/redirects/import",
            { csv: "откуда;куда;код\n/a;/b\n/c;/d;410" },
            { headers: admin },
          )
          .catch((error) => error.response);
        expect(broken.status).toBe(400);
        expect(broken.data.message).toContain("строка 3");
        expect(await rules()).toEqual([]);

        const { data } = await api.post(
          "/admin/redirects/import",
          { csv: "/a;/b\n/gone;;" },
          { headers: admin },
        );
        expect(data.count).toBe(2);
        expect(await resolve("/gone")).toEqual({
          from_path: "/gone",
          to_path: null,
          code: 410,
        });
      });

      it("отдаёт страницу для админки и удаляет правило", async () => {
        await save({ from_path: "/one", to_path: "/two", code: 301 });
        await save({ from_path: "/three", to_path: "/four", code: 301 });

        const { data } = await api.get("/admin/redirects?q=thr&limit=10", {
          headers: admin,
        });
        expect(data.count).toBe(1);
        expect(data.redirects[0]).toEqual(
          expect.objectContaining({ from_path: "/three", entity_type: null }),
        );

        await api.delete(`/admin/redirects/${data.redirects[0].id}`, {
          headers: admin,
        });
        expect(await resolve("/three")).toBeNull();

        const missing = await api
          .delete("/admin/redirects/redir_missing", { headers: admin })
          .catch((e) => e.response);
        expect(missing.status).toBe(404);
      });

      it("закрыт без авторизации админа", async () => {
        const response = await api
          .get("/admin/redirects")
          .catch((error) => error.response);
        expect(response.status).toBe(401);
      });
    });

    describe("URL сущностей", () => {
      const categoryHandle = async (id: string): Promise<string> => {
        const query = getContainer().resolve(ContainerRegistrationKeys.QUERY);
        const { data } = await query.graph({
          entity: "product_category",
          fields: ["handle"],
          filters: { id },
        });
        return data[0].handle;
      };

      it("транслитерирует handle и ставит 301 при переименовании, без цепочек", async () => {
        const {
          result: [category],
        } = await createProductCategoriesWorkflow(getContainer()).run({
          input: {
            product_categories: [
              {
                name: "Мужская обувь",
                is_active: true,
                parent_category_id: await testCategoryRoot(getContainer()),
              },
            ],
          },
        });

        await waitFor(
          async () => (await categoryHandle(category.id)) === "muzhskaya-obuv",
        );

        const rename = (handle: string) =>
          updateProductCategoriesWorkflow(getContainer()).run({
            input: { selector: { id: category.id }, update: { handle } },
          });

        await rename("obuv-dlya-muzhchin");
        await waitFor(() => resolve("/catalog/muzhskaya-obuv"));
        expect(await resolve("/catalog/muzhskaya-obuv")).toEqual({
          from_path: "/catalog/muzhskaya-obuv",
          to_path: "/catalog/obuv-dlya-muzhchin",
          code: 301,
        });

        await rename("muzhskaya-obuv");
        await waitFor(() => resolve("/catalog/obuv-dlya-muzhchin"));

        // Вернулись к старому handle: с него редирект снят (страница живая), со второго — 301 обратно
        expect(await rules()).toEqual([
          {
            from_path: "/catalog/obuv-dlya-muzhchin",
            to_path: "/catalog/muzhskaya-obuv",
            code: 301,
          },
        ]);
      });

      it("переименовывает товар и ставит 301 со старой страницы", async () => {
        const {
          result: [product],
        } = await createProductsWorkflow(getContainer()).run({
          input: {
            products: [
              {
                title: "Футболка хлопковая",
                status: "draft",
                sales_channels: await testSalesChannels(getContainer()),
                options: [{ title: "Размер", values: ["M"] }],
              },
            ],
          },
        });
        const productHandle = async (): Promise<string> => {
          const query = getContainer().resolve(ContainerRegistrationKeys.QUERY);
          const { data } = await query.graph({
            entity: "product",
            fields: ["handle"],
            filters: { id: product.id },
          });
          return data[0].handle;
        };

        await waitFor(
          async () => (await productHandle()) === "futbolka-hlopkovaya",
        );

        await updateProductsWorkflow(getContainer()).run({
          input: {
            selector: { id: product.id },
            update: { handle: "futbolka-iz-hlopka" },
          },
        });
        await waitFor(() => resolve("/products/futbolka-hlopkovaya"));
        expect(await resolve("/products/futbolka-hlopkovaya")).toEqual({
          from_path: "/products/futbolka-hlopkovaya",
          to_path: "/products/futbolka-iz-hlopka",
          code: 301,
        });
      });

      it("закрывает удалённый товар кодом 410 вместе со старыми путями и открывает путь новому товару", async () => {
        const createProduct = async (handle: string): Promise<string> => {
          const {
            result: [product],
          } = await createProductsWorkflow(getContainer()).run({
            input: {
              products: [
                {
                  title: "Кепка",
                  handle,
                  status: "draft",
                  sales_channels: await testSalesChannels(getContainer()),
                  options: [{ title: "Размер", values: ["M"] }],
                },
              ],
            },
          });
          return product.id;
        };
        const productId = await createProduct("kepka");
        await waitFor(() => trackedPath(getContainer(), productId));

        await updateProductsWorkflow(getContainer()).run({
          input: {
            selector: { id: productId },
            update: { handle: "kepka-letnyaya" },
          },
        });
        await waitFor(() => resolve("/products/kepka"));

        await deleteProductsWorkflow(getContainer()).run({
          input: { ids: [productId] },
        });
        await waitFor(() => resolve("/products/kepka-letnyaya"));

        expect(await rules()).toEqual([
          { from_path: "/products/kepka", to_path: null, code: 410 },
          { from_path: "/products/kepka-letnyaya", to_path: null, code: 410 },
        ]);

        // Тот же handle у нового товара — страница снова живая, 410 снят
        await createProduct("kepka-letnyaya");
        await waitFor(
          async () => (await resolve("/products/kepka-letnyaya")) === null,
        );
        expect(await resolve("/products/kepka")).toEqual(
          expect.objectContaining({ code: 410 }),
        );
      });

      it("закрывает удалённую категорию кодом 410", async () => {
        const {
          result: [category],
        } = await createProductCategoriesWorkflow(getContainer()).run({
          input: {
            product_categories: [
              {
                name: "Sale",
                handle: "sale",
                is_active: true,
                parent_category_id: await testCategoryRoot(getContainer()),
              },
            ],
          },
        });
        await waitFor(() => trackedPath(getContainer(), category.id));
        await updateProductCategoriesWorkflow(getContainer()).run({
          input: {
            selector: { id: category.id },
            update: { handle: "sale-2026" },
          },
        });
        await waitFor(() => resolve("/catalog/sale"));

        await deleteProductCategoriesWorkflow(getContainer()).run({
          input: [category.id],
        });
        await waitFor(
          async () => (await resolve("/catalog/sale-2026"))?.code === 410,
        );
        expect(await resolve("/catalog/sale")).toEqual({
          from_path: "/catalog/sale",
          to_path: null,
          code: 410,
        });
      });

      it("делает handle уникальным", async () => {
        const parent_category_id = await testCategoryRoot(getContainer());
        await createProductCategoriesWorkflow(getContainer()).run({
          input: {
            product_categories: [
              { name: "Шапки", is_active: true, parent_category_id },
            ],
          },
        });
        const {
          result: [second],
        } = await createProductCategoriesWorkflow(getContainer()).run({
          input: {
            product_categories: [
              { name: "Шапки!", is_active: true, parent_category_id },
            ],
          },
        });

        await waitFor(
          async () => (await categoryHandle(second.id)) === "shapki-2",
        );
      });
    });
  },
});
