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
});
