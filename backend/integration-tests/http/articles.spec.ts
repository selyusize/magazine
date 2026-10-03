import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import { adminHeaders, storeHeaders, waitFor } from "./helpers/auth";
import { trackedPath } from "./helpers/redirects";

jest.setTimeout(120 * 1000);

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let store: Record<string, string>;
    let admin: Record<string, string>;

    const resolve = async (path: string) =>
      (
        await api.get(
          `/store/redirects/resolve?path=${encodeURIComponent(path)}`,
          { headers: store },
        )
      ).data.redirect;

    beforeEach(async () => {
      store = await storeHeaders(getContainer());
      admin = await adminHeaders(api, getContainer());
    });

    it("создаёт черновик со slug из заголовка и фильтрует по статусу", async () => {
      const { data } = await api.post(
        "/admin/articles",
        {
          title: "Как выбрать кроссовки для бега",
          excerpt: "Коротко",
          body: "<p>Текст</p>",
        },
        { headers: admin },
      );
      expect(data.article).toEqual(
        expect.objectContaining({
          handle: "kak-vybrat-krossovki-dlya-bega",
          status: "draft",
          body: "<p>Текст</p>",
        }),
      );
      await api.post(
        "/admin/articles",
        { title: "Уход за обувью", status: "published" },
        { headers: admin },
      );

      const published = await api.get("/admin/articles?status=published", {
        headers: admin,
      });
      expect(
        published.data.articles.map(
          (article: { title: string }) => article.title,
        ),
      ).toEqual(["Уход за обувью"]);

      const wrongStatus = await api
        .post(
          "/admin/articles",
          { title: "X", status: "archived" },
          { headers: admin },
        )
        .catch((error) => error.response);
      expect(wrongStatus.status).toBe(400);
    });

    it("смена handle — 301 в блоге, удаление — 410", async () => {
      const { data } = await api.post(
        "/admin/articles",
        { title: "Гид по размерам" },
        { headers: admin },
      );
      const id = data.article.id;

      await waitFor(() => trackedPath(getContainer(), id));
      await api.post(
        `/admin/articles/${id}`,
        { handle: "razmery" },
        { headers: admin },
      );
      await waitFor(() => resolve("/blog/gid-po-razmeram"));
      expect(await resolve("/blog/gid-po-razmeram")).toEqual(
        expect.objectContaining({ to_path: "/blog/razmery", code: 301 }),
      );

      await api.delete(`/admin/articles/${id}`, { headers: admin });
      await waitFor(async () => (await resolve("/blog/razmery"))?.code === 410);
      expect((await resolve("/blog/gid-po-razmeram")).code).toBe(410);
    });
  },
});
