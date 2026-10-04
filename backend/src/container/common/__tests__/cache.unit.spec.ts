import {
  storefrontTargetsForEvent,
  tagsForEvent,
  type StorefrontTarget,
} from "@shared/service/cache-invalidation/cache-invalidator";

import { cacheInvalidationEvents, cacheInvalidationRules } from "../cache";

/** Единственная цель витрины события; для таблицы случаев реестра. */
function target(event: string): StorefrontTarget {
  const [only, ...rest] = storefrontTargetsForEvent(cacheInvalidationRules, event);
  if (!only || rest.length) throw new Error(`у ${event} не одна цель витрины`);
  return only;
}

function entity(event: string) {
  const found = target(event);
  if (found.scope !== "entity") throw new Error(`${event} — не сущность`);
  return found;
}

const productRow = {
  id: "prod_1",
  handle: "olisaːutyug",
  sales_channels: [{ id: "sc_1", shop: { id: "shop_a" } }],
};

describe("реестр инвалидации: событие → магазин и теги витрины", () => {
  it.each([
    ["product.updated", productRow, "shop_a", ["product:utyug", "products", "sitemap"]],
    ["product.deleted", productRow, "shop_a", ["product:utyug", "products", "sitemap"]],
    [
      "product-variant.updated",
      { id: "variant_1", product: productRow },
      "shop_a",
      ["product:utyug", "products"],
    ],
    [
      "product-category.updated",
      { id: "pcat_1", handle: "olisaːutyugi", shop: { id: "shop_a" } },
      "shop_a",
      ["category:utyugi", "categories", "navigation", "sitemap"],
    ],
    [
      "product-collection.created",
      { id: "pcol_1", handle: "olisaːnovinki", shop: { id: "shop_a" } },
      "shop_a",
      ["collection:novinki", "collections", "sitemap"],
    ],
    [
      "brand.updated",
      { id: "brand_1", shop_id: "shop_a", handle: "philips" },
      "shop_a",
      ["brand:philips", "brands", "products", "sitemap"],
    ],
    ["attribute.updated", { id: "attr_1", shop_id: "shop_a" }, "shop_a", ["products"]],
    [
      "article.created",
      { id: "art_1", shop_id: "shop_a", handle: "kak-vybrat" },
      "shop_a",
      ["article:kak-vybrat", "articles", "sitemap"],
    ],
    [
      "filter_page.updated",
      { id: "fp_1", shop_id: "shop_a", handle: "philips", product_category: { handle: "olisaːutyugi" } },
      "shop_a",
      ["filter-page:utyugi/philips", "category:utyugi", "filter-pages", "sitemap"],
    ],
    [
      "import_run.completed",
      { id: "run_1", supplier: { shop_id: "shop_a" } },
      "shop_a",
      ["products", "categories", "navigation", "brands", "sitemap"],
    ],
  ])("%s", (event, row, shop, tags) => {
    const rule = entity(event);
    expect(rule.shopOf(row)).toBe(shop);
    expect(rule.tags(row)).toEqual(tags);
  });

  it("товар в двух каналах или без магазина — магазина нет (orphan → все магазины)", () => {
    const rule = entity("product.updated");
    expect(rule.shopOf({ ...productRow, sales_channels: [] })).toBeNull();
    expect(rule.orphan_tags).toEqual(["products", "sitemap"]);
  });

  it("магазин — в данных события: смена магазина и редиректы", () => {
    expect(target("shop.updated")).toEqual({ scope: "shop", field: "id", tags: ["shop"] });
    expect(target("redirect.updated")).toEqual({ scope: "shop", field: "shop_id", tags: ["redirects", "sitemap"] });
  });

  it("сетевые сущности — всем магазинам", () => {
    expect(target("network_settings.updated")).toEqual({ scope: "network", tags: ["shop"] });
    expect(target("region.updated")).toEqual({ scope: "network", tags: ["regions", "products"] });
  });

  it("кэш бэкенда «магазины» сбрасывается по shop.*", () => {
    expect(tagsForEvent(cacheInvalidationRules, "shop.created", { id: "shop_a" })).toEqual(["shops"]);
    expect(tagsForEvent(cacheInvalidationRules, "shop.updated", { id: "shop_a" })).toEqual(["shops"]);
  });

  it("подписчик слушает все события реестра", () => {
    expect(cacheInvalidationEvents).toEqual(
      expect.arrayContaining(["brand.deleted", "redirect.updated", "import_run.completed", "product-variant.updated"]),
    );
  });
});
