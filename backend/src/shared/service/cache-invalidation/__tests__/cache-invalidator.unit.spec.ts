import type { ICachingModuleService, Logger } from "@medusajs/framework/types";

import {
  CacheInvalidationRegistry,
  CacheInvalidator,
  eventValues,
  on,
  storefrontTargetsForEvent,
  tagsForEvent,
  type CacheInvalidationRule,
} from "../cache-invalidator";

const RULES: CacheInvalidationRule[] = [
  ...on(["shop.created", "shop.updated"], { backend: () => ["shops"] }),
  {
    event: "shop.updated",
    backend: (data) => [`shop:${JSON.stringify(data)}`, "shops"],
    storefront: { scope: "shop", field: "id", tags: ["shop"] },
  },
  { event: "network_settings.updated", storefront: { scope: "network", tags: ["shop"] } },
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
  it("собирает теги бэкенда всех правил события без повторов", () => {
    expect(tagsForEvent(RULES, "shop.updated", { id: "shop_1" })).toEqual(["shops", 'shop:{"id":"shop_1"}']);
  });

  it("событие вне реестра или без тегов бэкенда — тегов нет", () => {
    expect(tagsForEvent(RULES, "brand.updated", {})).toEqual([]);
    expect(tagsForEvent(RULES, "network_settings.updated", {})).toEqual([]);
  });
});

describe("storefrontTargetsForEvent", () => {
  it("цели витрин — только правил события, где они описаны", () => {
    expect(storefrontTargetsForEvent(RULES, "shop.updated")).toEqual([{ scope: "shop", field: "id", tags: ["shop"] }]);
    expect(storefrontTargetsForEvent(RULES, "shop.created")).toEqual([]);
  });
});

describe("eventValues", () => {
  it.each([
    [{ id: "a" }, "id", ["a"]],
    [[{ id: "a" }, { id: "b" }, { id: "a" }], "id", ["a", "b"]],
    [[{ shop_id: "s1" }, { shop_id: null }], "shop_id", ["s1"]],
    [{}, "id", []],
    [null, "id", []],
    [{ id: "" }, "id", []],
  ])("%j[%s] → %j", (data, field, expected) => {
    expect(eventValues(data, field)).toEqual(expected);
  });
});

describe("CacheInvalidationRegistry", () => {
  it("события реестра — для подписчика, без повторов", () => {
    expect(new CacheInvalidationRegistry(RULES).events).toEqual([
      "shop.created",
      "shop.updated",
      "network_settings.updated",
    ]);
  });
});

describe("CacheInvalidator", () => {
  const make = (cache: Pick<ICachingModuleService, "clear"> | undefined) =>
    new CacheInvalidator(new CacheInvalidationRegistry(RULES), cache, logger);

  it("сбрасывает теги события в модуле кэша", async () => {
    const { cache, cleared } = fakeCache();
    await make(cache).invalidate("shop.created", { id: "shop_1" });
    expect(cleared).toEqual([["shops"]]);
  });

  it("без модуля кэша (нет Redis) и без тегов — ничего не сбрасывает", async () => {
    const { cache, cleared } = fakeCache();
    await expect(make(undefined).invalidate("shop.created", {})).resolves.toEqual(["shops"]);
    await make(cache).invalidate("brand.updated", {});
    expect(cleared).toEqual([]);
  });
});
