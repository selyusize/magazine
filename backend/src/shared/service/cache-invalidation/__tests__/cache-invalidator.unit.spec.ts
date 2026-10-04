import type { ICachingModuleService, Logger } from "@medusajs/framework/types";

import {
  CacheInvalidator,
  type CacheInvalidationRule,
  tagsForEvent,
} from "../cache-invalidator";

const RULES: CacheInvalidationRule[] = [
  { event: "shop.created", tags: () => ["shops"] },
  { event: "shop.updated", tags: () => ["shops"] },
  {
    event: "shop.updated",
    tags: (data) => [`shop:${JSON.stringify(data)}`, "shops"],
  },
];

const logger: Pick<Logger, "debug"> = { debug: jest.fn() };

/** Фейк модуля кэша: запоминает сброшенные теги. Остальные методы тесту не нужны. */
function fakeCache() {
  const cleared: string[][] = [];
  const cache: Pick<ICachingModuleService, "clear"> = {
    clear: async ({ tags }) => {
      cleared.push(tags ?? []);
    },
  };
  return { cache, cleared };
}

describe("tagsForEvent", () => {
  it("собирает теги всех правил события без повторов", () => {
    expect(tagsForEvent(RULES, "shop.updated", { id: "shop_1" })).toEqual([
      "shops",
      'shop:{"id":"shop_1"}',
    ]);
  });

  it("событие вне реестра — тегов нет", () => {
    expect(tagsForEvent(RULES, "brand.updated", {})).toEqual([]);
  });
});

describe("CacheInvalidator", () => {
  const make = (cache: Pick<ICachingModuleService, "clear"> | undefined) =>
    new CacheInvalidator(RULES, cache, logger);

  it("события реестра — для подписчика", () => {
    expect(make(undefined).events).toEqual(["shop.created", "shop.updated"]);
  });

  it("сбрасывает теги события в модуле кэша", async () => {
    const { cache, cleared } = fakeCache();
    await make(cache).invalidate("shop.created", { id: "shop_1" });
    expect(cleared).toEqual([["shops"]]);
  });

  it("без модуля кэша (нет Redis) и без тегов — ничего не сбрасывает", async () => {
    const { cache, cleared } = fakeCache();
    await expect(
      make(undefined).invalidate("shop.created", {}),
    ).resolves.toEqual(["shops"]);
    await make(cache).invalidate("brand.updated", {});
    expect(cleared).toEqual([]);
  });
});
