import { createApiKeysWorkflow } from "@medusajs/medusa/core-flows";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import { adminHeaders, createTestShop } from "./helpers/auth";

jest.setTimeout(120 * 1000);

type Shop = Awaited<ReturnType<typeof createTestShop>>;

const NETWORK = {
  name: "Snowaa",
  legal_name: "ООО «Сноуа»",
  inn: "7700000000",
  ogrn: "1027700000000",
  kpp: "770001001",
  legal_address: "123112, г. Москва, Пресненская наб., д. 1",
  phone: "+78000000000",
  email: "info@snowaa.ru",
};

/** Магазин запроса (ключ витрины, `x-shop-id`), CORS по таблице магазинов, реквизиты сети и `GET /store/shop`. */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>;
    let shopA: Shop;
    let shopB: Shop;

    const keyOf = (shop: Shop) => ({
      "x-publishable-api-key": shop.publishable_api_key ?? "",
    });
    const fail = (request: Promise<unknown>) =>
      request.then(
        () => {
          throw new Error("запрос должен был упасть");
        },
        (error) => error.response,
      );

    beforeEach(async () => {
      admin = await adminHeaders(api, getContainer());
      shopA = await createTestShop(getContainer(), {
        slug: "alpha",
        domain: "alpha.ru",
        storefront_url: "https://alpha.ru",
        settings: {
          contacts: { phone: "+78001111111" },
          logo_url: "https://alpha.ru/logo.svg",
        },
      });
      shopB = await createTestShop(getContainer(), {
        slug: "beta",
        domain: "beta.ru",
        storefront_url: "https://www.beta.ru",
      });
    });

    describe("GET /store/shop", () => {
      it("отдаёт магазин своего ключа и сетевые реквизиты", async () => {
        await api.post("/admin/network-settings", NETWORK, { headers: admin });

        const { data: a } = await api.get("/store/shop", {
          headers: keyOf(shopA),
        });
        expect(a.shop).toEqual({
          slug: "alpha",
          name: shopA.name,
          domain: "alpha.ru",
          url: "https://alpha.ru",
          logo_url: "https://alpha.ru/logo.svg",
          contacts: { phone: "+78001111111", email: null, address: null },
          network: {
            name: "Snowaa",
            legal: {
              name: "ООО «Сноуа»",
              inn: "7700000000",
              ogrn: "1027700000000",
              kpp: "770001001",
              address: NETWORK.legal_address,
            },
            phone: NETWORK.phone,
            email: NETWORK.email,
          },
        });

        const { data: b } = await api.get("/store/shop", {
          headers: keyOf(shopB),
        });
        expect(b.shop).toEqual(
          expect.objectContaining({
            slug: "beta",
            domain: "beta.ru",
            url: "https://www.beta.ru",
            logo_url: null,
          }),
        );
        expect(b.shop.network).toEqual(a.shop.network);
      });

      it("реквизиты сети не заполнены — null, а не ошибка", async () => {
        const { data } = await api.get("/store/shop", {
          headers: keyOf(shopA),
        });
        expect(data.shop.network).toEqual({
          name: null,
          legal: {
            name: null,
            inn: null,
            ogrn: null,
            kpp: null,
            address: null,
          },
          phone: null,
          email: null,
        });
      });

      it("без ключа — 400, неизвестный ключ — 400", async () => {
        expect((await fail(api.get("/store/shop"))).status).toBe(400);
        const unknown = await fail(
          api.get("/store/shop", {
            headers: { "x-publishable-api-key": "pk_unknown" },
          }),
        );
        expect(unknown.status).toBe(400);
      });

      it("ключ без магазина — 403", async () => {
        const {
          result: [apiKey],
        } = await createApiKeysWorkflow(getContainer()).run({
          input: {
            api_keys: [
              { title: "Без магазина", type: "publishable", created_by: "" },
            ],
          },
        });

        const response = await fail(
          api.get("/store/shop", {
            headers: { "x-publishable-api-key": apiKey.token },
          }),
        );
        expect(response.status).toBe(403);
        expect(response.data.message).toContain("не привязан к магазину");
      });

      it("выключенный магазин — 403 на любом store-роуте, соседний работает", async () => {
        await api.post(
          `/admin/shops/${shopA.id}`,
          { is_active: false },
          { headers: admin },
        );

        const shop = await fail(
          api.get("/store/shop", { headers: keyOf(shopA) }),
        );
        expect(shop.status).toBe(403);
        expect(shop.data.message).toContain("alpha выключен");

        const products = await fail(
          api.get("/store/products", { headers: keyOf(shopA) }),
        );
        expect(products.status).toBe(403);

        expect(
          (await api.get("/store/shop", { headers: keyOf(shopB) })).status,
        ).toBe(200);
      });
    });

    describe("CORS по таблице магазинов", () => {
      it("пускает домен магазина и адрес витрины без рестарта, отражая Origin", async () => {
        const fresh = await createTestShop(getContainer(), {
          slug: "gamma",
          domain: "gamma.ru",
          storefront_url: "https://gamma.ru",
        });

        for (const origin of [
          "https://gamma.ru",
          "https://www.beta.ru",
          "https://beta.ru",
        ]) {
          const response = await api.get("/store/shop", {
            headers: { ...keyOf(fresh), origin },
          });
          expect(response.status).toBe(200);
          expect(response.headers["access-control-allow-origin"]).toBe(origin);
          expect(response.headers["access-control-allow-credentials"]).toBe(
            "true",
          );
        }
      });

      it("preflight с домена магазина проходит", async () => {
        const response = await api.request({
          method: "OPTIONS",
          url: "/store/shop",
          headers: {
            origin: "https://alpha.ru",
            "access-control-request-method": "GET",
            "access-control-request-headers": "x-publishable-api-key",
          },
        });
        expect(response.status).toBe(204);
        expect(response.headers["access-control-allow-origin"]).toBe(
          "https://alpha.ru",
        );
      });

      it("чужой Origin — 403 без Access-Control-Allow-Origin, и в /store, и в /auth", async () => {
        const store = await fail(
          api.get("/store/shop", {
            headers: { ...keyOf(shopA), origin: "https://evil.example" },
          }),
        );
        expect(store.status).toBe(403);
        expect(store.headers["access-control-allow-origin"]).toBeUndefined();

        const auth = await fail(
          api.post(
            "/auth/customer/emailpass",
            { email: "a@b.ru", password: "x" },
            { headers: { origin: "https://evil.example" } },
          ),
        );
        expect(auth.status).toBe(403);
      });

      it("выключенный магазин теряет CORS", async () => {
        await api.post(
          `/admin/shops/${shopB.id}`,
          { is_active: false },
          { headers: admin },
        );

        const response = await fail(
          api.get("/store/shop", {
            headers: { ...keyOf(shopA), origin: "https://www.beta.ru" },
          }),
        );
        expect(response.status).toBe(403);
      });

      it("/auth с домена магазина доходит до проверки пароля", async () => {
        const response = await fail(
          api.post(
            "/auth/customer/emailpass",
            { email: "nobody@alpha.ru", password: "wrong" },
            { headers: { origin: "https://alpha.ru" } },
          ),
        );
        expect(response.status).toBe(401);
        expect(response.headers["access-control-allow-origin"]).toBe(
          "https://alpha.ru",
        );
      });
    });

    describe("x-shop-id в Admin API", () => {
      it("отдаёт текущий магазин по заголовку", async () => {
        const { data } = await api.get("/admin/shops/current", {
          headers: { ...admin, "x-shop-id": shopB.id },
        });
        expect(data.shop).toEqual({
          id: shopB.id,
          slug: "beta",
          name: shopB.name,
          domain: "beta.ru",
          storefront_url: "https://www.beta.ru",
          is_active: true,
          sales_channel_id: shopB.sales_channel_id,
        });
      });

      it("без заголовка — 400, неизвестный магазин — 400", async () => {
        const missing = await fail(
          api.get("/admin/shops/current", { headers: admin }),
        );
        expect(missing.status).toBe(400);
        expect(missing.data.message).toContain("x-shop-id");

        const unknown = await fail(
          api.get("/admin/shops/current", {
            headers: { ...admin, "x-shop-id": "shop_x" },
          }),
        );
        expect(unknown.status).toBe(400);
        expect(unknown.data.message).toContain("shop_x");
      });

      it("сетевые роуты работают без заголовка", async () => {
        expect((await api.get("/admin/shops", { headers: admin })).status).toBe(
          200,
        );
      });
    });

    describe("/admin/network-settings", () => {
      it("до заполнения — пустые реквизиты; сохранение и частичное изменение", async () => {
        const { data: empty } = await api.get("/admin/network-settings", {
          headers: admin,
        });
        expect(empty.network_settings).toEqual({
          name: null,
          legal_name: null,
          inn: null,
          ogrn: null,
          kpp: null,
          legal_address: null,
          phone: null,
          email: null,
        });

        const { data: saved } = await api.post(
          "/admin/network-settings",
          NETWORK,
          { headers: admin },
        );
        expect(saved.network_settings).toEqual(NETWORK);

        // ИП: ИНН 12 цифр, ОГРНИП 15, КПП нет
        const { data: changed } = await api.post(
          "/admin/network-settings",
          {
            legal_name: "ИП Иванов",
            inn: "770000000000",
            ogrn: "304770000000000",
            kpp: null,
          },
          { headers: admin },
        );
        expect(changed.network_settings).toEqual({
          ...NETWORK,
          legal_name: "ИП Иванов",
          inn: "770000000000",
          ogrn: "304770000000000",
          kpp: null,
        });

        const { data: read } = await api.get("/admin/network-settings", {
          headers: admin,
        });
        expect(read.network_settings).toEqual(changed.network_settings);
      });

      it("проверяет формат: ИНН, ОГРН, КПП, email, лишние поля — 400", async () => {
        for (const body of [
          { inn: "123" },
          { ogrn: "12345678901234" },
          { kpp: "12345" },
          { email: "not-email" },
          { unknown: "x" },
        ]) {
          const response = await fail(
            api.post("/admin/network-settings", body, { headers: admin }),
          );
          expect(response.status).toBe(400);
        }
      });

      it("без входа в админку — 401", async () => {
        expect((await fail(api.get("/admin/network-settings"))).status).toBe(
          401,
        );
      });
    });
  },
});
