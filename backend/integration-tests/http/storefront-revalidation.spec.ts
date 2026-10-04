import { createServer, type IncomingMessage, type Server } from "node:http";

import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import { adminHeaders, createTestShop, waitFor } from "./helpers/auth";

jest.setTimeout(120 * 1000);

type Received = { secret: string | undefined; tags: string[] };

/** Фейковая витрина магазина: принимает вебхуки ревалидации и отвечает заданным кодом. */
type FakeStorefront = {
  url: string;
  received: Received[];
  status: number;
  close: () => Promise<void>;
};

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });

async function fakeStorefront(): Promise<FakeStorefront> {
  const received: Received[] = [];
  const storefront = { received, status: 200 };
  const server: Server = createServer(async (req, res) => {
    const body: unknown = JSON.parse((await readBody(req)) || "{}");
    const tags = typeof body === "object" && body && "tags" in body && Array.isArray(body.tags) ? body.tags : [];
    if (req.url === "/api/revalidate" && req.method === "POST") {
      const header = req.headers["x-revalidate-secret"];
      received.push({ secret: typeof header === "string" ? header : undefined, tags });
    }
    res.writeHead(storefront.status, { "Content-Type": "application/json" }).end("{}");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return Object.assign(storefront, {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  });
}

/** Шаг 7: изменение сущности → вебхук ревалидации только витрине своего магазина, журнал отправок в админке. */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let alpha: FakeStorefront;
    let beta: FakeStorefront;
    let adminA: Record<string, string>;
    let adminB: Record<string, string>;
    let admin: Record<string, string>;

    const fail = (request: Promise<unknown>) =>
      request.then(
        () => {
          throw new Error("запрос должен был упасть");
        },
        (error) => error.response,
      );
    const tagsOf = (storefront: FakeStorefront) => storefront.received.flatMap((request) => request.tags);
    const journal = async (headers: Record<string, string>) =>
      (await api.get("/admin/storefront-revalidations", { headers })).data.storefront_revalidations;

    beforeEach(async () => {
      [alpha, beta] = await Promise.all([fakeStorefront(), fakeStorefront()]);
      const container = getContainer();
      const [shopA, shopB, headers] = await Promise.all([
        createTestShop(container, { storefront_url: alpha.url, revalidate_secret: "secret-alpha" }),
        createTestShop(container, { storefront_url: beta.url, revalidate_secret: "secret-beta" }),
        adminHeaders(api, container),
      ]);
      admin = headers;
      adminA = { ...headers, "x-shop-id": shopA.id };
      adminB = { ...headers, "x-shop-id": shopB.id };

      // Новый магазин сам шлёт пачку (его корневая категория) — дожидаемся её и начинаем с чистых приёмников
      await Promise.all(
        [adminA, adminB].map((headers) =>
          waitFor(async () => {
            const rows = await journal(headers);
            return rows.length > 0 && rows.every((row: { status: string }) => row.status === "sent");
          }),
        ),
      );
      alpha.received.length = 0;
      beta.received.length = 0;
    });

    afterEach(async () => {
      await Promise.all([alpha.close(), beta.close()]);
    });

    it("изменение бренда: свежие данные в API и вебхук только витрине своего магазина", async () => {
      const { data: created } = await api.post("/admin/brands", { name: "Philips" }, { headers: adminA });
      await api.post(`/admin/brands/${created.brand.id}`, { name: "Philips Home" }, { headers: adminA });

      const { data } = await api.get(`/admin/brands/${created.brand.id}`, { headers: adminA });
      expect(data.brand.name).toBe("Philips Home");

      await waitFor(async () => tagsOf(alpha).includes("brand:philips"));
      expect(tagsOf(alpha)).toEqual(expect.arrayContaining(["brand:philips", "brands", "products", "sitemap"]));
      expect(alpha.received.every((request) => request.secret === "secret-alpha")).toBe(true);
      expect(beta.received).toEqual([]);

      const [sent] = await waitFor(async () => {
        const rows = await journal(adminA);
        return rows[0]?.status === "sent" ? rows : null;
      });
      expect(sent).toEqual(
        expect.objectContaining({ status: "sent", attempts: 0, response_status: 200, error: null }),
      );
      // В журнале магазина B — только его собственная пачка корневой категории
      const tagsB = (await journal(adminB)).flatMap((row: { tags: string[] }) => row.tags);
      expect(tagsB).not.toContain("brand:philips");
    });

    it("редирект в админке → тег redirects витрине магазина", async () => {
      await api.post("/admin/redirects", { from_path: "/old", to_path: "/new", code: 301 }, { headers: adminB });
      await waitFor(async () => tagsOf(beta).includes("redirects"));
      expect(alpha.received).toEqual([]);
    });

    it("«обновить витрину целиком» — все групповые теги текущего магазина", async () => {
      const { status, data } = await api.post("/admin/storefront-revalidations", {}, { headers: adminA });
      expect(status).toBe(202);
      expect(data.ids).toHaveLength(1);

      await waitFor(async () => alpha.received.length > 0);
      expect(alpha.received[0].tags).toEqual(expect.arrayContaining(["products", "redirects", "shop", "sitemap"]));
      expect(beta.received).toEqual([]);
    });

    it("витрина отвечает ошибкой — запись в журнале и повтор по расписанию", async () => {
      alpha.status = 401;
      await api.post("/admin/storefront-revalidations", {}, { headers: adminA });

      const [row] = await waitFor(async () => {
        const rows = await journal(adminA);
        return rows[0]?.attempts === 1 ? rows : null;
      });
      expect(row).toEqual(
        expect.objectContaining({
          status: "pending",
          attempts: 1,
          response_status: 401,
          error: "витрина ответила 401",
        }),
      );
      expect(new Date(row.due_at).getTime()).toBeGreaterThan(Date.now());
    });

    it("секрет вебхука: показ и перевыпуск в текущем магазине", async () => {
      const { data } = await api.get("/admin/shops/current/revalidate-secret", { headers: adminA });
      expect(data.storefront_webhook).toEqual({
        revalidate_url: `${alpha.url}/api/revalidate`,
        revalidate_secret: "secret-alpha",
      });

      const { data: regenerated } = await api.post("/admin/shops/current/revalidate-secret", {}, { headers: adminA });
      const secret = regenerated.storefront_webhook.revalidate_secret;
      expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/);

      const { data: after } = await api.get("/admin/shops/current/revalidate-secret", { headers: adminA });
      expect(after.storefront_webhook.revalidate_secret).toBe(secret);

      await api.post("/admin/storefront-revalidations", {}, { headers: adminA });
      await waitFor(async () => alpha.received.length > 0);
      expect(alpha.received[0].secret).toBe(secret);

      // Секрет не утекает в карточку магазина
      const { data: shops } = await api.get("/admin/shops", { headers: admin });
      expect(JSON.stringify(shops)).not.toContain(secret);
    });

    it("без x-shop-id — 400, без входа — 401", async () => {
      for (const request of [
        api.get("/admin/storefront-revalidations", { headers: admin }),
        api.post("/admin/storefront-revalidations", {}, { headers: admin }),
        api.get("/admin/shops/current/revalidate-secret", { headers: admin }),
      ]) {
        expect((await fail(request)).status).toBe(400);
      }
      const anonymous = await fail(api.get("/admin/storefront-revalidations"));
      expect(anonymous.status).toBe(401);
    });
  },
});
