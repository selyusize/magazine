import { moduleIntegrationTestRunner } from "@medusajs/test-utils";

import { REDIRECT_MODULE } from "../index";
import type { RedirectModuleService } from "../service/redirect-module-service";

jest.setTimeout(60 * 1000);

const SHOP = "shop_a";

moduleIntegrationTestRunner<RedirectModuleService>({
  moduleName: REDIRECT_MODULE,
  resolve: "./src/modules/redirect",
  testSuite: ({ service }) => {
    const table = async (shop_id = SHOP) =>
      (await service.listRedirects({ shop_id }, { order: { from_path: "ASC" } })).map(
        ({ from_path, to_path, code }) => ({
          from_path,
          to_path,
          code,
        }),
      );

    describe("RedirectModuleService", () => {
      it("сохраняет правило с нормализованными путями и перезаписывает по from_path", async () => {
        await service.saveRedirects([
          { shop_id: SHOP, from_path: "https://olisa.ru/a/?x=1", to_path: "/b/", code: 301 },
        ]);
        await service.saveRedirects([
          { shop_id: SHOP, from_path: "/a", to_path: "/c", code: 302 },
        ]);

        expect(await table()).toEqual([
          { from_path: "/a", to_path: "/c", code: 302 },
        ]);
      });

      it("схлопывает цепочки и не создаёт циклов", async () => {
        await service.saveRedirects([
          { shop_id: SHOP, from_path: "/a", to_path: "/b", code: 301 },
          { shop_id: SHOP, from_path: "/b", to_path: "/c", code: 301 },
        ]);
        expect(await table()).toEqual([
          { from_path: "/a", to_path: "/c", code: 301 },
          { from_path: "/b", to_path: "/c", code: 301 },
        ]);

        // c → a при a → c — настоящий цикл: отклоняем, таблица не меняется
        await expect(
          service.saveRedirects([
            { shop_id: SHOP, from_path: "/c", to_path: "/a", code: 301 },
          ]),
        ).rejects.toThrow("замыкается в цикл");
        expect(await table()).toHaveLength(2);
      });

      it("410 распространяется на всех, кто вёл на удалённую страницу", async () => {
        await service.saveRedirects([
          { shop_id: SHOP, from_path: "/old", to_path: "/page", code: 302 },
        ]);
        await service.saveRedirects([
          { shop_id: SHOP, from_path: "/page", to_path: null, code: 410 },
        ]);

        expect(await table()).toEqual([
          { from_path: "/old", to_path: null, code: 410 },
          { from_path: "/page", to_path: null, code: 410 },
        ]);
      });

      it("откат возвращает таблицу в исходное состояние", async () => {
        await service.saveRedirects([
          { shop_id: SHOP, from_path: "/x", to_path: "/y", code: 301 },
        ]);
        const before = await table();

        // y → z перенаправит x → y на z, w → x пойдёт сразу в z: тронуты три строки
        const { changes } = await service.saveRedirects([
          { shop_id: SHOP, from_path: "/y", to_path: "/z", code: 301 },
          { shop_id: SHOP, from_path: "/w", to_path: "/x", code: 301 },
        ]);
        expect(await table()).toEqual([
          { from_path: "/w", to_path: "/z", code: 301 },
          { from_path: "/x", to_path: "/z", code: 301 },
          { from_path: "/y", to_path: "/z", code: 301 },
        ]);

        await service.revertRedirectChanges(changes);
        expect(await table()).toEqual(before);
      });

      it("освобождает путь, на котором снова живая страница", async () => {
        await service.saveRedirects([
          { shop_id: SHOP, from_path: "/catalog/obuv", to_path: "/catalog/shoes", code: 301 },
        ]);

        const changes = await service.releasePath({ shop_id: SHOP, path: "/catalog/obuv/" });
        expect(await table()).toEqual([]);

        await service.revertRedirectChanges(changes);
        expect(await table()).toEqual([
          { from_path: "/catalog/obuv", to_path: "/catalog/shoes", code: 301 },
        ]);
      });

      it("правила магазинов не пересекаются: тот же путь, свои цели, без цепочек через чужой магазин", async () => {
        await service.saveRedirects([{ shop_id: SHOP, from_path: "/a", to_path: "/b", code: 301 }]);
        await service.saveRedirects([
          { shop_id: "shop_b", from_path: "/a", to_path: "/c", code: 301 },
          { shop_id: "shop_b", from_path: "/b", to_path: "/d", code: 301 },
        ]);

        expect(await table()).toEqual([{ from_path: "/a", to_path: "/b", code: 301 }]);
        expect(await table("shop_b")).toEqual([
          { from_path: "/a", to_path: "/c", code: 301 },
          { from_path: "/b", to_path: "/d", code: 301 },
        ]);

        await service.releasePath({ shop_id: "shop_b", path: "/a" });
        expect(await table()).toHaveLength(1);
      });

      it("не принимает несогласованное правило", async () => {
        await expect(
          service.saveRedirects([
            { shop_id: SHOP, from_path: "/a", to_path: "/b", code: 410 },
          ]),
        ).rejects.toThrow("410");
        await expect(
          service.saveRedirects([
            { shop_id: SHOP, from_path: "/a", to_path: null, code: 301 },
          ]),
        ).rejects.toThrow("назначения");
      });
    });
  },
});
