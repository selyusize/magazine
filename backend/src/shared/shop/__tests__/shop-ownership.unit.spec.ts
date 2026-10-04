import { shopIdAt } from "../shop-ownership";

describe("shopIdAt", () => {
  it("своё поле сущности", () => {
    expect(shopIdAt({ id: "sup_1", shop_id: "shop_a" }, "shop_id")).toBe("shop_a");
  });

  it("поле через связь", () => {
    expect(shopIdAt({ id: "imprun_1", supplier: { shop_id: "shop_b" } }, "supplier.shop_id")).toBe("shop_b");
  });

  it("нет связи, поля или строка не строка — null", () => {
    expect(shopIdAt({ id: "imprun_1", supplier: null }, "supplier.shop_id")).toBeNull();
    expect(shopIdAt({ id: "sup_1" }, "shop_id")).toBeNull();
    expect(shopIdAt({ shop_id: 42 }, "shop_id")).toBeNull();
    expect(shopIdAt(undefined, "shop_id")).toBeNull();
  });

  it("путь через список: ровно один магазин — он, иначе null", () => {
    const product = (...shops: (string | null)[]) => ({
      id: "prod_1",
      sales_channels: shops.map((id) => ({ id: "sc", shop: id ? { id } : null })),
    });
    expect(shopIdAt(product("shop_a"), "sales_channels.shop.id")).toBe("shop_a");
    expect(shopIdAt(product(), "sales_channels.shop.id")).toBeNull();
    expect(shopIdAt(product("shop_a", "shop_b"), "sales_channels.shop.id")).toBeNull();
    expect(shopIdAt(product(null), "sales_channels.shop.id")).toBeNull();
  });
});
