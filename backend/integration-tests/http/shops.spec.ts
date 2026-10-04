import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

import { initialShopConfig } from "../../src/container/common/shop";
import initialDataSeed from "../../src/migration-scripts/initial-data-seed";

import { SHOP_ROOT_CATEGORY_DATA } from "../../src/shared/shop/catalog-shop";

import { adminHeaders } from "./helpers/auth";

jest.setTimeout(120 * 1000);

const NEW_SHOP = {
  slug: "snow",
  name: "Snow Shop",
  domain: "snow.example.com",
  storefront_url: "https://snow.example.com",
};

/** Магазины сети: создание кнопкой в админке (`create-shop`), изменение, выключение, откат при сбое. */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>;

    const graph = async (
      entity: string,
      fields: string[],
      filters: Record<string, unknown> = {},
    ) =>
      (
        await getContainer()
          .resolve(ContainerRegistrationKeys.QUERY)
          .graph({ entity, fields, filters })
      ).data;
    const create = (body: Record<string, unknown>) =>
      api.post("/admin/shops", body, { headers: admin });
    const update = (id: string, body: Record<string, unknown>) =>
      api.post(`/admin/shops/${id}`, body, { headers: admin });
    const fail = (request: Promise<unknown>) =>
      request.then(
        () => {
          throw new Error("запрос должен был упасть");
        },
        (error) => error.response,
      );

    beforeEach(async () => {
      // Сид поднимает сеть и olisa — как при первом `db:migrate`
      await initialDataSeed({ container: getContainer() });
      admin = await adminHeaders(api, getContainer());
    });

    it("создаёт второй магазин со своим каналом, ключом, корневой категорией и складом с доставкой", async () => {
      const { status, data } = await create({
        ...NEW_SHOP,
        settings: { contacts: { phone: "+7 800 000-00-00" } },
      });

      expect(status).toBe(201);
      expect(data.shop).toEqual(
        expect.objectContaining({
          id: expect.stringMatching(/^shop_/),
          ...NEW_SHOP,
          is_active: true,
          settings: { contacts: { phone: "+7 800 000-00-00" } },
          sales_channel_id: expect.stringMatching(/^sc_/),
          publishable_api_key: expect.stringMatching(/^pk_/),
          root_category_id: expect.stringMatching(/^pcat_/),
        }),
      );

      const [olisa] = await graph(
        "shop",
        ["api_key.token", "sales_channel.id"],
        { slug: "olisa" },
      );
      expect(olisa.api_key.token).not.toBe(data.shop.publishable_api_key);
      expect(olisa.sales_channel.id).not.toBe(data.shop.sales_channel_id);

      const [key] = await graph("api_key", ["type", "sales_channels.id"], {
        token: data.shop.publishable_api_key,
      });
      expect(key).toEqual(
        expect.objectContaining({
          type: "publishable",
          sales_channels: [
            expect.objectContaining({ id: data.shop.sales_channel_id }),
          ],
        }),
      );

      const [root] = await graph(
        "product_category",
        ["handle", "parent_category_id"],
        {
          id: data.shop.root_category_id,
        },
      );
      expect(root).toEqual(
        expect.objectContaining({
          handle: "snowːcatalog",
          parent_category_id: null,
        }),
      );

      // Склад с доставкой из сида открыт обоим каналам — иначе в корзине нового магазина нет способов доставки
      const locations = await graph("stock_location", [
        "sales_channels.id",
        "fulfillment_sets.id",
      ]);
      const shipping = locations.filter(
        (location) => location.fulfillment_sets.length > 0,
      );
      expect(shipping).toHaveLength(1);
      expect(shipping[0].sales_channels.map((channel) => channel.id)).toEqual(
        expect.arrayContaining([
          olisa.sales_channel.id,
          data.shop.sales_channel_id,
        ]),
      );
    });

    it("отдаёт список с поиском, карточку и 404", async () => {
      const { data: created } = await create(NEW_SHOP);

      const { data } = await api.get("/admin/shops?q=snow", { headers: admin });
      expect(data).toEqual(
        expect.objectContaining({
          shops: [
            expect.objectContaining({ id: created.shop.id, slug: "snow" }),
          ],
          count: 1,
        }),
      );

      const { data: all } = await api.get("/admin/shops", { headers: admin });
      expect(all.shops.map((shop: { slug: string }) => shop.slug)).toEqual([
        "olisa",
        "snow",
      ]);

      const { data: one } = await api.get(`/admin/shops/${created.shop.id}`, {
        headers: admin,
      });
      expect(one.shop).toEqual(created.shop);

      const missing = await fail(
        api.get("/admin/shops/shop_missing", { headers: admin }),
      );
      expect(missing.status).toBe(404);
    });

    it("меняет название, домен и настройки, выключает магазин; slug не меняется", async () => {
      const { data: created } = await create(NEW_SHOP);

      const { data } = await update(created.shop.id, {
        name: "Snow",
        domain: "snow.ru",
        storefront_url: "https://snow.ru",
        is_active: false,
        settings: { logo_url: "https://snow.ru/logo.svg" },
      });
      expect(data.shop).toEqual(
        expect.objectContaining({
          slug: "snow",
          name: "Snow",
          domain: "snow.ru",
          storefront_url: "https://snow.ru",
          is_active: false,
          settings: { logo_url: "https://snow.ru/logo.svg" },
          publishable_api_key: created.shop.publishable_api_key,
        }),
      );

      const slug = await fail(update(created.shop.id, { slug: "other" }));
      expect(slug.status).toBe(400);

      const removed = await fail(
        api.delete(`/admin/shops/${created.shop.id}`, { headers: admin }),
      );
      expect(removed.status).toBe(404);
    });

    it("проверяет тело: некорректный slug, домен с протоколом, занятые slug и домен — 400", async () => {
      const badSlug = await fail(create({ ...NEW_SHOP, slug: "Snow Shop" }));
      expect(badSlug.status).toBe(400);

      const badDomain = await fail(
        create({ ...NEW_SHOP, domain: "https://snow.ru" }),
      );
      expect(badDomain.status).toBe(400);

      const takenSlug = await fail(create({ ...NEW_SHOP, slug: "olisa" }));
      expect(takenSlug.status).toBe(400);
      expect(takenSlug.data.message).toContain("«olisa» уже занят");

      const takenDomain = await fail(
        create({ ...NEW_SHOP, domain: initialShopConfig.domain }),
      );
      expect(takenDomain.status).toBe(400);
      expect(takenDomain.data.message).toContain(
        `«${initialShopConfig.domain}» уже занят`,
      );
    });

    it("без входа в админку — 401", async () => {
      const list = await fail(api.get("/admin/shops"));
      expect(list.status).toBe(401);

      const created = await fail(api.post("/admin/shops", NEW_SHOP));
      expect(created.status).toBe(401);
    });

    it("сбой на шаге корневой категории откатывает канал, ключ и магазин", async () => {
      // Handle корня уже занят — workflow падает после создания канала и ключа. Занимает его ничья категория (как
      // корень до связи с магазином): у категории чужого магазина синхронизация адреса сменила бы префикс
      await createProductCategoriesWorkflow(getContainer()).run({
        input: {
          product_categories: [{ name: "Чужая", handle: "snowːcatalog" }],
          additional_data: SHOP_ROOT_CATEGORY_DATA,
        },
      });
      const channelsBefore = await graph("sales_channel", ["id"]);
      const keysBefore = await graph("api_key", ["id"]);

      const response = await fail(create(NEW_SHOP));
      expect(response.status).toBeGreaterThanOrEqual(400);

      expect(await graph("shop", ["id"], { slug: "snow" })).toEqual([]);
      expect(await graph("sales_channel", ["id"])).toHaveLength(
        channelsBefore.length,
      );
      expect(await graph("api_key", ["id"])).toHaveLength(keysBefore.length);

      // После отката тот же магазин создаётся с другим slug — блокировка снята, домен свободен
      const retry = await create({ ...NEW_SHOP, slug: "snow-2" });
      expect(retry.status).toBe(201);
    });
  },
});
