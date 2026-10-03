import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";

import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, getVariantAvailability } from "@medusajs/framework/utils";
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import sharp from "sharp";

import { adminHeaders, waitFor } from "./helpers/auth";
import { buildZip } from "./helpers/zip";

jest.setTimeout(240 * 1000);

type Response = { status: number; data: Record<string, any> };

const FIXTURES = path.resolve(__dirname, "../fixtures/commerceml");
const fixture = (name: string) => readFileSync(path.join(FIXTURES, name), "utf8");
const LOGIN = "1c-exchange";
const PASSWORD = "s3cret";

/** Картинка-квадрат нужного цвета: разные цвета — разное содержимое (дедуп по sha256). */
const image = (background: string) =>
  sharp({ create: { width: 8, height: 8, channels: 3, background } }).png().toBuffer();

/**
 * Этап 4 плана: импорт CommerceML 2 — push по протоколу 1С (zip частями), pull по ссылке, повторный и
 * инкрементальный импорт, маппинг групп, защита ручных правок, склейка товара двух поставщиков.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>;

    const query = () => getContainer().resolve(ContainerRegistrationKeys.QUERY);
    const post = (url: string, body: Record<string, unknown>) =>
      api.post(url, body, { headers: admin }) as Promise<Response>;
    const get = (url: string) => api.get(url, { headers: admin }) as Promise<Response>;
    const fail = (request: Promise<unknown>): Promise<Response> =>
      request.then(
        () => {
          throw new Error("запрос должен был упасть");
        },
        (error) => error.response,
      );

    const createSupplier = async (name: string, exchange: Record<string, unknown>) => {
      const { data } = await post("/admin/suppliers", {
        name,
        ship_city: "Москва",
        exchange: { mode: "push", login: LOGIN, password: PASSWORD, ...exchange },
        markup: { percent: 20 },
      });
      // Склад поставщика создаёт подписчик — без него остатки некуда класть
      await waitFor(async () => (await get(`/admin/suppliers/${data.supplier.id}`)).data.supplier.stock_location_id);
      return data.supplier.id as string;
    };

    /** Сеанс 1С: checkauth → init → zip частями → import, пока не перестанет отвечать `progress`. */
    const exchange = async (supplierId: string, files: Record<string, Buffer | string>) => {
      let cookie = "";
      const call = async (params: string, body?: Buffer, auth?: string) => {
        const config = {
          headers: {
            ...(cookie ? { cookie } : {}),
            ...(auth ? { authorization: auth } : {}),
            ...(body ? { "content-type": "application/octet-stream" } : {}),
          },
          validateStatus: () => true,
          transformResponse: (data: unknown) => data,
        };
        const url = `/1c/exchange/${supplierId}?type=catalog&${params}`;
        const response = body ? await api.post(url, body, config) : await api.get(url, config);
        return { status: response.status, lines: String(response.data).split("\n") };
      };

      const auth = await call("mode=checkauth", undefined, basic(LOGIN, PASSWORD));
      expect(auth.lines[0]).toBe("success");
      cookie = `${auth.lines[1]}=${auth.lines[2]}`;
      expect((await call("mode=init")).lines[0]).toBe("zip=yes");

      const zip = buildZip(files);
      const half = Math.floor(zip.length / 2);
      expect((await call("mode=file&filename=package.zip", zip.subarray(0, half))).lines).toEqual(["success"]);
      expect((await call("mode=file&filename=package.zip", zip.subarray(half))).lines).toEqual(["success"]);

      const result = await waitFor(async () => {
        const reply = await call("mode=import&filename=import.xml");
        return reply.lines[0] === "progress" ? null : reply.lines;
      }, 120_000);
      expect(result).toEqual(["success"]);
      expect((await call("mode=import&filename=offers.xml")).lines).toEqual(["success"]);
      const { data } = await get(`/admin/import-runs?supplier_id=${supplierId}&limit=1`);
      return (await get(`/admin/import-runs/${data.import_runs[0].id}`)).data.import_run;
    };

    const packageFiles = async (overrides: Record<string, string> = {}) => ({
      "import.xml": fixture("import.xml"),
      "offers.xml": fixture("offers.xml"),
      "import_files/ab/airmax-1.jpg": await image("#ff0000"),
      "import_files/ab/airmax-2.jpg": await image("#00ff00"),
      "import_files/cd/suede.png": await image("#0000ff"),
      ...overrides,
    });

    /** Карточка товара поставщика со всем, что пишет импорт. */
    const card = async (supplierId: string, externalId: string) => {
      const { data: rows } = await query().graph({
        entity: "exchange_product",
        fields: ["product_id", "is_owner", "problems", "manual_fields"],
        filters: { supplier_id: supplierId, external_id: externalId },
      });
      const row = rows[0] as unknown as { product_id: string; is_owner: boolean; problems: string[]; manual_fields: string[] };
      const { data } = await query().graph({
        entity: "product",
        fields: [
          "id",
          "title",
          "handle",
          "status",
          "description",
          "thumbnail",
          "images.url",
          "metadata",
          "brand.name",
          "product_main_category.category_id",
          "attribute_values.value",
          "variants.id",
          "variants.title",
          "variants.prices.amount",
          "variants.supplier_offers.quantity",
          "variants.supplier_offers.purchase_price",
          "variants.supplier_offers.supplier_id",
        ],
        filters: { id: row.product_id },
      });
      return { row, product: data[0] as Record<string, any> };
    };

    const variant = (product: Record<string, any>, title: string) =>
      product.variants.find((item: { title: string }) => item.title === title);

    const availability = async (container: MedusaContainer, variantId: string) => {
      const { data } = await query().graph({ entity: "store", fields: ["default_sales_channel_id"] });
      const result = await getVariantAvailability(container.resolve(ContainerRegistrationKeys.QUERY), {
        variant_ids: [variantId],
        sales_channel_id: data[0]!.default_sales_channel_id!,
      });
      return result[variantId].availability ?? 0;
    };

    beforeEach(async () => {
      admin = await adminHeaders(api, getContainer());
      await post("/admin/attributes", { name: "Материал" });
    });

    it("push: пакет 1С zip-архивом частями → черновики с вариантами, ценами, остатками, брендом и характеристиками", async () => {
      const supplierId = await createSupplier("Альфа", {
        purchase_price_type: "Оптовая",
        retail_price_type: "Розничная",
        publish: true,
      });

      const run = await exchange(supplierId, await packageFiles());

      expect(run).toEqual(
        expect.objectContaining({
          status: "done",
          source: "push",
          files: ["import.xml", "offers.xml"],
          stats: {
            products: { received: 3, created: 3 },
            offers: { received: 5, created: 4, failed: 1 },
          },
        }),
      );
      expect(run.errors).toEqual(
        expect.arrayContaining([
          { external_id: null, message: "import.xml: товар без Ид или названия" },
          { external_id: "prd-unknown#x", message: "товара нет в каталоге поставщика (import.xml)" },
        ]),
      );

      const { product: airmax, row } = await card(supplierId, "prd-airmax");
      expect(row.is_owner).toBe(true);
      expect(airmax).toEqual(
        expect.objectContaining({
          title: "Кроссовки Air Max 90",
          handle: "krossovki-air-max-90",
          status: "draft",
          description: "Классические кроссовки с воздушной подушкой.",
          brand: expect.objectContaining({ name: "NIKE" }),
          attribute_values: [expect.objectContaining({ value: "Кожа" })],
          metadata: expect.objectContaining({ supplier_properties: { "Страна производства": "Вьетнам" } }),
        }),
      );
      expect(airmax.images).toHaveLength(2);
      expect(airmax.thumbnail).toBe(airmax.images[0].url);
      expect(variant(airmax, "42").prices).toEqual([expect.objectContaining({ amount: 9990 })]);
      expect(variant(airmax, "42").supplier_offers).toEqual([
        expect.objectContaining({ quantity: 5, purchase_price: 6000 }),
      ]);
      expect(await availability(getContainer(), variant(airmax, "43").id)).toBe(3);
      // Группа не сопоставлена с категорией — черновик в очереди разбора
      expect(row.problems).toEqual(["unmapped_group"]);

      const { product: suede } = await card(supplierId, "prd-suede");
      expect(suede.brand.name).toBe("Puma");
      expect(variant(suede, "Основной").prices).toEqual([expect.objectContaining({ amount: 4201 })]);
      const { product: laces, row: lacesRow } = await card(supplierId, "prd-laces");
      expect(variant(laces, "Основной").supplier_offers).toEqual([expect.objectContaining({ quantity: 0 })]);
      expect(lacesRow.problems).toEqual(["unmapped_group", "no_image"]);

      const { data: review } = await get(`/admin/suppliers/${supplierId}/exchange-review`);
      expect(review).toEqual(expect.objectContaining({ count: 3, unmapped_groups: 3 }));
      const { data: properties } = await get(`/admin/suppliers/${supplierId}/exchange-properties`);
      expect(properties.exchange_properties).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Материал", attribute_name: "Материал" }),
          expect.objectContaining({ name: "Бренд", attribute_id: null }),
        ]),
      );

      // Тот же пакет ещё раз — ничего не меняется
      const updatedAt = (await query().graph({ entity: "product", fields: ["id", "updated_at"] })).data;
      const again = await exchange(supplierId, await packageFiles());
      expect(again.stats).toEqual({
        products: { received: 3, skipped: 3 },
        offers: { received: 5, failed: 1 },
      });
      expect((await query().graph({ entity: "product", fields: ["id", "updated_at"] })).data).toEqual(updatedAt);
    });

    it("маппинг группы → категория на следующем импорте, публикация готовых; ручная правка названия защищена", async () => {
      const supplierId = await createSupplier("Альфа", { publish: true, retail_price_type: "Розничная" });
      await exchange(supplierId, await packageFiles());
      const {
        result: [shoes],
      } = await createProductCategoriesWorkflow(getContainer()).run({
        input: { product_categories: [{ name: "Обувь", handle: "obuv", is_active: true }] },
      });

      const { data: groups } = await get(`/admin/suppliers/${supplierId}/exchange-groups`);
      const group = groups.exchange_groups.find((item: { external_id: string }) => item.external_id === "grp-shoes");
      const mapped = await post(`/admin/exchange-groups/${group.id}`, { category_id: shoes.id });
      expect(mapped.data.exchange_group).toEqual({ id: group.id, category_id: shoes.id });

      const { product: before } = await card(supplierId, "prd-airmax");
      await post(`/admin/products/${before.id}`, { title: "Наши кроссовки" });

      const changed = fixture("import.xml")
        .replace("<Наименование>Кроссовки Air Max 90</Наименование>", "<Наименование>Кроссовки Air Max 90 NEW</Наименование>")
        .replace("Классические кроссовки", "Обновлённые кроссовки");
      await exchange(supplierId, await packageFiles({ "import.xml": changed }));

      const { product: airmax, row } = await card(supplierId, "prd-airmax");
      expect(airmax).toEqual(
        expect.objectContaining({
          title: "Наши кроссовки",
          description: "Обновлённые кроссовки с воздушной подушкой.",
          status: "published",
          product_main_category: expect.objectContaining({ category_id: shoes.id }),
        }),
      );
      expect(row).toEqual(expect.objectContaining({ manual_fields: ["title"], problems: [] }));
      // Подгруппа «Кеды» не сопоставлена — категория от родителя «Обувь»
      expect((await card(supplierId, "prd-suede")).product.status).toBe("published");
      expect((await card(supplierId, "prd-laces")).product.status).toBe("draft");
    });

    it("инкремент 2.10 меняет закупку, цену и остаток, не трогая остальное; полная выгрузка обнуляет пропавшие", async () => {
      const supplierId = await createSupplier("Альфа", {
        purchase_price_type: "pt-purchase",
        retail_price_type: "Розничная",
      });
      await exchange(supplierId, await packageFiles());

      const changes = await exchange(supplierId, { "offers.xml": fixture("offers-changes-2.10.xml") });
      expect(changes.only_changes).toBe(true);
      const { product: airmax } = await card(supplierId, "prd-airmax");
      expect(variant(airmax, "42").supplier_offers).toEqual([
        expect.objectContaining({ quantity: 3, purchase_price: 6500 }),
      ]);
      // Розничной цены в изменениях нет — закупка + наценка 20%
      expect(variant(airmax, "42").prices).toEqual([expect.objectContaining({ amount: 7800 })]);
      expect(variant(airmax, "43").supplier_offers[0].quantity).toBe(3);
      expect(variant((await card(supplierId, "prd-suede")).product, "Основной").supplier_offers[0].quantity).toBe(7);

      const withoutSuede = fixture("offers.xml").replace(/<Предложение>\s*<Ид>prd-suede<\/Ид>[\s\S]*?<\/Предложение>/, "");
      const full = await exchange(supplierId, { "offers.xml": withoutSuede });
      expect(full.stats.offers.zeroed).toBe(1);
      const { product: suede } = await card(supplierId, "prd-suede");
      expect(variant(suede, "Основной").supplier_offers[0].quantity).toBe(0);
      expect(await availability(getContainer(), variant(suede, "Основной").id)).toBe(0);
    });

    it("товар второго поставщика с тем же штрихкодом — та же карточка, наличие — сумма остатков", async () => {
      const alpha = await createSupplier("Альфа", {});
      await exchange(alpha, await packageFiles());
      const beta = await createSupplier("Бета", {});
      const betaCatalog = `<?xml version="1.0" encoding="UTF-8"?>
        <КоммерческаяИнформация ВерсияСхемы="2.05"><Каталог><Товары>
          <Товар><Ид>b-1</Ид><Штрихкод>4600000000017</Штрихкод><Наименование>Puma Suede (оригинал)</Наименование></Товар>
        </Товары></Каталог></КоммерческаяИнформация>`;
      const betaOffers = `<?xml version="1.0" encoding="UTF-8"?>
        <КоммерческаяИнформация ВерсияСхемы="2.05"><ПакетПредложений><Предложения>
          <Предложение><Ид>b-1</Ид><Цены><Цена><ИдТипаЦены>x</ИдТипаЦены><ЦенаЗаЕдиницу>3300</ЦенаЗаЕдиницу></Цена></Цены><Количество>4</Количество></Предложение>
        </Предложения></ПакетПредложений></КоммерческаяИнформация>`;

      const run = await exchange(beta, { "import.xml": betaCatalog, "offers.xml": betaOffers });

      // Своей карточки у Беты нет — товар склеен с карточкой Альфы
      expect(run.stats.products).toEqual({ received: 1, linked: 1 });
      const { product: suede } = await card(alpha, "prd-suede");
      const { row: betaRow, product: same } = await card(beta, "b-1");
      expect(betaRow.is_owner).toBe(false);
      expect(same.id).toBe(suede.id);
      expect(same.title).toBe("Кеды Suede Classic");
      expect(variant(same, "Основной").supplier_offers).toHaveLength(2);
      expect(await availability(getContainer(), variant(same, "Основной").id)).toBe(11);
    });

    it("pull: выгрузка по ссылке с Basic-доступом; недоступная ссылка — запуск failed, повтор упавшего", async () => {
      const server = await serve({
        "/feed/import.xml": fixture("import.xml"),
        "/feed/offers.xml": fixture("offers.xml"),
      });
      const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      try {
        const supplierId = await createSupplier("Гамма", {
          mode: "pull",
          urls: [`${base}/feed/import.xml`, `${base}/feed/offers.xml`],
          url_login: "shop",
          url_password: "feed",
        });
        const started = await post(`/admin/suppliers/${supplierId}/import-runs`, {});
        expect(started.status).toBe(202);
        const run = await waitFor(async () => {
          const { data } = await get(`/admin/import-runs/${started.data.import_run.id}`);
          return data.import_run.status === "done" ? data.import_run : null;
        }, 120_000);
        expect(run).toEqual(
          expect.objectContaining({ source: "manual", files: ["01-import.xml", "02-offers.xml"] }),
        );
        // Картинок по ссылке нет — товары без фото, ошибки в запуске
        expect(run.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining("Картинка import_files/ab/airmax-1.jpg") })]),
        );
        expect((await card(supplierId, "prd-airmax")).product.variants).toHaveLength(2);

        const broken = await createSupplier("Дельта", {
          mode: "pull",
          urls: [`${base}/missing.xml`],
          url_login: "shop",
          url_password: "feed",
        });
        const failed = (await post(`/admin/suppliers/${broken}/import-runs`, {})).data.import_run;
        expect(failed).toEqual(
          expect.objectContaining({ status: "failed", message: expect.stringContaining("HTTP 404") }),
        );
        expect((await post(`/admin/import-runs/${failed.id}/retry`, {})).status).toBe(202);
        const done = await fail(post(`/admin/import-runs/${run.id}/retry`, {}));
        expect(done.status).toBe(400);
      } finally {
        server.close();
      }
    });

    it("протокол: неверный пароль — 401, обмен выключен — 403, заказы — failure, чужое имя файла — 400", async () => {
      const supplierId = await createSupplier("Альфа", {});
      const call = (params: string, authorization?: string) =>
        api.get(`/1c/exchange/${supplierId}?type=catalog&${params}`, {
          headers: authorization ? { authorization } : {},
          validateStatus: () => true,
          transformResponse: (data: unknown) => data,
        });

      const wrong = await call("mode=checkauth", basic(LOGIN, "nope"));
      expect([wrong.status, wrong.data]).toEqual([401, "failure\nНеверный логин или пароль"]);
      expect((await call("mode=init")).status).toBe(401);
      const sale = await api.get(`/1c/exchange/${supplierId}?type=sale&mode=query`, {
        headers: { authorization: basic(LOGIN, PASSWORD) },
        transformResponse: (data: unknown) => data,
      });
      expect(sale.data).toBe("failure\nОбмен заказами пока не поддерживается");
      expect((await call("mode=file&filename=../../etc/passwd", basic(LOGIN, PASSWORD))).status).toBe(400);

      await post(`/admin/suppliers/${supplierId}`, { exchange: { mode: "off" } });
      const off = await call("mode=checkauth", basic(LOGIN, PASSWORD));
      expect([off.status, off.data]).toEqual([403, "failure\nОбмен с этим поставщиком выключен"]);
    });
  },
});

function basic(login: string, password: string): string {
  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
}

/** Поставщик для pull: отдаёт файлы только с Basic `shop:feed`. */
function serve(files: Record<string, string>): Promise<Server> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      if (req.headers.authorization !== basic("shop", "feed")) {
        res.writeHead(401).end();
        return;
      }
      const body = files[req.url ?? ""];
      if (body === undefined) res.writeHead(404, "Not Found").end();
      else res.writeHead(200, { "content-type": "application/xml" }).end(body);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}
