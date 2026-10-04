import { MedusaError } from "@medusajs/framework/utils";

import {
  requireAdminShop,
  requireShop,
  type ShopContext,
} from "../shop-context";

const SHOP: ShopContext = {
  id: "shop_1",
  slug: "olisa",
  name: "Olisa",
  domain: "olisa.ru",
  storefront_url: "https://olisa.ru",
  is_active: true,
  sales_channel_id: "sc_1",
};

describe("requireShop / requireAdminShop", () => {
  it("отдают магазин запроса", () => {
    expect(requireShop({ shop: SHOP })).toBe(SHOP);
    expect(requireAdminShop({ shop: SHOP })).toBe(SHOP);
  });

  it("Store без магазина — FORBIDDEN (403)", () => {
    expect(() => requireShop({})).toThrow(
      expect.objectContaining({ type: MedusaError.Types.FORBIDDEN }),
    );
  });

  it("Admin без x-shop-id — INVALID_DATA (400) с именем заголовка", () => {
    expect(() => requireAdminShop({})).toThrow(
      expect.objectContaining({
        type: MedusaError.Types.INVALID_DATA,
        message: expect.stringContaining("x-shop-id"),
      }),
    );
  });
});
