import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import productBrandLink from "../../src/links/product-brand";

import { adminShopHeaders, storeHeaders, waitFor } from "./helpers/auth";
import { trackedPath } from "./helpers/redirects";

jest.setTimeout(120 * 1000);

type Rule = { from_path: string; to_path: string | null; code: number };

/** Бренды — на них же проверяется CRUD-фабрика (`src/shared/crud`): статьи и посадочные устроены так же. */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let store: Record<string, string>;
    let admin: Record<string, string>;
    let salesChannelId: string;

    const resolve = async (path: string): Promise<Rule | null> =>
      (
        await api.get(
          `/store/redirects/resolve?path=${encodeURIComponent(path)}`,
          { headers: store },
        )
      ).data.redirect;
    const create = (body: Record<string, unknown>) =>
      api.post("/admin/brands", body, { headers: admin });
    const update = (id: string, body: Record<string, unknown>) =>
      api.post(`/admin/brands/${id}`, body, { headers: admin });
    const fail = (request: Promise<unknown>) =>
      request.then(
        () => {
          throw new Error("запрос должен был упасть");
        },
        (error) => error.response,
      );

    beforeEach(async () => {
      store = await storeHeaders(getContainer());
      const { headers, shop } = await adminShopHeaders(api, getContainer());
      admin = headers;
      salesChannelId = shop.sales_channel_id ?? "";
    });

    it("создаёт бренд со slug из названия и уникализирует его", async () => {
      const first = await create({ name: "Адидас Ориджиналс" });
      expect(first.status).toBe(201);
      expect(first.data.brand).toEqual(
        expect.objectContaining({
          id: expect.stringMatching(/^brand_/),
          name: "Адидас Ориджиналс",
          handle: "adidas-oridzhinals",
          description: null,
          is_active: true,
        }),
      );

      const second = await create({ name: "Адидас — Ориджиналс!" });
      expect(second.data.brand.handle).toBe("adidas-oridzhinals-2");
    });

    it("явный handle приводит к slug, занятый — 400 с понятным текстом", async () => {
      const { data } = await create({ name: "Nike", handle: "Найк" });
      expect(data.brand.handle).toBe("nayk");

      const taken = await fail(create({ name: "Другой", handle: "nayk" }));
      expect(taken.status).toBe(400);
      expect(taken.data.message).toContain("«nayk» уже занят");
    });

    it("отдаёт список с поиском и пагинацией, карточку и 404", async () => {
      await create({ name: "Puma" });
      await create({ name: "Reebok" });
      const { data: puma } = await create({ name: "Puma Kids" });

      const { data } = await api.get("/admin/brands?q=pum&limit=1", {
        headers: admin,
      });
      expect(data).toEqual(
        expect.objectContaining({ count: 2, limit: 1, offset: 0 }),
      );
      expect(data.brands).toEqual([expect.objectContaining({ name: "Puma" })]);

      const one = await api.get(`/admin/brands/${puma.brand.id}`, {
        headers: admin,
      });
      expect(one.data.brand.handle).toBe("puma-kids");

      const missing = await fail(
        api.get("/admin/brands/brand_missing", { headers: admin }),
      );
      expect(missing.status).toBe(404);
    });

    it("валидирует тело и закрыт без авторизации", async () => {
      expect((await fail(create({ name: "" }))).status).toBe(400);
      expect((await fail(create({ name: "X", unknown_field: 1 }))).status).toBe(
        400,
      );
      expect((await fail(api.get("/admin/brands"))).status).toBe(401);
    });

    it("переименование не меняет адрес; смена handle — 301 со старой страницы", async () => {
      const { data } = await create({ name: "Asics" });
      const id = data.brand.id;

      const renamed = await update(id, {
        name: "ASICS Corporation",
        description: "Япония",
      });
      expect(renamed.data.brand).toEqual(
        expect.objectContaining({
          name: "ASICS Corporation",
          handle: "asics",
          description: "Япония",
        }),
      );

      await waitFor(() => trackedPath(getContainer(), id));
      await update(id, { handle: "asics-japan" });
      await waitFor(() => resolve("/brands/asics"));
      expect(await resolve("/brands/asics")).toEqual({
        from_path: "/brands/asics",
        to_path: "/brands/asics-japan",
        code: 301,
      });

      const missing = await fail(update("brand_missing", { name: "X" }));
      expect(missing.status).toBe(404);
    });

    it("удаление — 410 со всех путей, handle снова свободен", async () => {
      const { data } = await create({ name: "Fila" });
      await waitFor(() => trackedPath(getContainer(), data.brand.id));
      await update(data.brand.id, { handle: "fila-italy" });
      await waitFor(() => resolve("/brands/fila"));

      const deleted = await api.delete(`/admin/brands/${data.brand.id}`, {
        headers: admin,
      });
      expect(deleted.data).toEqual({
        id: data.brand.id,
        object: "brand",
        deleted: true,
      });

      await waitFor(
        async () => (await resolve("/brands/fila-italy"))?.code === 410,
      );
      expect(await resolve("/brands/fila")).toEqual({
        from_path: "/brands/fila",
        to_path: null,
        code: 410,
      });

      const again = await create({ name: "Fila Italy" });
      expect(again.data.brand.handle).toBe("fila-italy");
      await waitFor(async () => (await resolve("/brands/fila-italy")) === null);

      const missing = await fail(
        api.delete(`/admin/brands/${data.brand.id}`, { headers: admin }),
      );
      expect(missing.status).toBe(404);
    });

    it("удаление бренда снимает его связь с товарами — строка связи не остаётся", async () => {
      const { data } = await create({ name: "Kappa" });
      const {
        result: [product],
      } = await createProductsWorkflow(getContainer()).run({
        input: {
          products: [
            {
              title: "Кеды",
              status: "draft",
              sales_channels: [{ id: salesChannelId }],
              options: [{ title: "Размер", values: ["M"] }],
            },
          ],
        },
      });
      await api.post(
        `/admin/products/${product.id}/catalog`,
        { brand_id: data.brand.id },
        { headers: admin },
      );

      const links = async () => {
        const query = getContainer().resolve(ContainerRegistrationKeys.QUERY);
        const { data: rows } = await query.graph({
          entity: productBrandLink.entryPoint,
          fields: ["product_id", "brand_id", "deleted_at"],
          filters: { brand_id: data.brand.id },
          withDeleted: true,
        });
        return rows as { product_id: string; deleted_at: string | null }[];
      };
      expect(await links()).toEqual([
        expect.objectContaining({ product_id: product.id, deleted_at: null }),
      ]);

      await api.delete(`/admin/brands/${data.brand.id}`, { headers: admin });

      expect(await links()).toEqual([
        expect.objectContaining({ product_id: product.id, deleted_at: expect.anything() }),
      ]);
      const catalog = await api.get(`/admin/products/${product.id}/catalog`, {
        headers: admin,
      });
      expect(catalog.data.catalog.brand).toBeNull();
    });
  },
});
