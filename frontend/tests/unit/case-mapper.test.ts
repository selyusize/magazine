import { describe, expect, it } from "vitest";

import { camelToSnake, camelizeKeys, snakeToCamel, snakeizeKeys } from "@shared/api/case";

import camelCaseSpec from "../../orval.transformer";

describe("Маппер имён: бэкенд snake_case ↔ фронт camelCase", () => {
  it("переводит имена полей в обе стороны", () => {
    expect(snakeToCamel("product_id")).toBe("productId");
    expect(snakeToCamel("sales_channel_id")).toBe("salesChannelId");
    expect(camelToSnake("productId")).toBe("product_id");
    expect(camelToSnake("salesChannelId")).toBe("sales_channel_id");
  });

  it("обратимо для полей с цифрами: address_1 остаётся address_1", () => {
    expect(snakeToCamel("address_1")).toBe("address_1");
    expect(camelToSnake(snakeToCamel("address_1"))).toBe("address_1");
    expect(camelToSnake(snakeToCamel("country_code_2"))).toBe("country_code_2");
  });

  it("не трогает имена без подчёркиваний, служебные и фильтры", () => {
    expect(snakeToCamel("id")).toBe("id");
    expect(snakeToCamel("_internal")).toBe("_internal");
    expect(camelToSnake("createdAt[$gt]")).toBe("created_at[$gt]");
  });

  it("глубоко преобразует объекты и массивы ответа", () => {
    const response = {
      cart: {
        id: "cart_1",
        customer_id: null,
        items: [{ product_id: "p1", unit_price: 10, variant: { sku_code: "A" } }],
        shipping_address: { address_1: "Ленина, 1", country_code: "ru" },
      },
    };
    expect(camelizeKeys(response)).toEqual({
      cart: {
        id: "cart_1",
        customerId: null,
        items: [{ productId: "p1", unitPrice: 10, variant: { skuCode: "A" } }],
        shippingAddress: { address_1: "Ленина, 1", countryCode: "ru" },
      },
    });
  });

  it("ключи внутри metadata и additional_data — данные магазина, их не трогаем", () => {
    const backend = { metadata: { lens_type: "progressive" }, additional_data: { erp_id: 7 } };
    const front = camelizeKeys<Record<string, unknown>>(backend);
    expect(front).toEqual({ metadata: { lens_type: "progressive" }, additionalData: { erp_id: 7 } });
    expect(snakeizeKeys(front)).toEqual(backend);
  });

  it("круговой путь бэкенд → фронт → бэкенд без потерь", () => {
    const backend = { variant_id: "v1", quantity: 2, shipping_address: { address_1: "x", address_2: "y" } };
    expect(snakeizeKeys(camelizeKeys(backend))).toEqual(backend);
  });

  it("значения не меняются, только ключи", () => {
    expect(camelizeKeys({ order: "created_at", fields: "*items.variant_id" })).toEqual({
      order: "created_at",
      fields: "*items.variant_id",
    });
  });
});

describe("Трансформер OpenAPI для Orval (то же правило в типах)", () => {
  const spec = {
    paths: {
      "/store/carts/{id}": {
        get: {
          parameters: [
            { name: "id", in: "path" },
            { name: "region_id", in: "query" },
          ],
        },
      },
    },
    components: {
      schemas: {
        Cart: {
          type: "object",
          required: ["id", "customer_id"],
          properties: {
            id: { type: "string" },
            customer_id: { type: "string" },
            shipping_address: {
              type: "object",
              properties: { address_1: { type: "string" }, country_code: { type: "string" } },
            },
            metadata: { type: "object", properties: { some_key: { type: "string" } } },
          },
        },
      },
    },
  };

  const result = camelCaseSpec(spec) as typeof spec & Record<string, never>;
  const cart = (result.components.schemas.Cart as unknown) as {
    required: string[];
    properties: Record<string, { properties?: Record<string, unknown> }>;
  };

  it("переименовывает поля схем и required", () => {
    expect(Object.keys(cart.properties)).toEqual(["id", "customerId", "shippingAddress", "metadata"]);
    expect(cart.required).toEqual(["id", "customerId"]);
    expect(Object.keys(cart.properties.shippingAddress!.properties!)).toEqual(["address_1", "countryCode"]);
  });

  it("переименовывает query-параметры, path-параметры не трогает", () => {
    const params = (result.paths["/store/carts/{id}"].get.parameters as { name: string }[]).map((p) => p.name);
    expect(params).toEqual(["id", "regionId"]);
  });

  it("не трогает содержимое metadata и пути API", () => {
    expect(Object.keys(cart.properties.metadata!.properties!)).toEqual(["some_key"]);
    expect(Object.keys(result.paths)).toEqual(["/store/carts/{id}"]);
  });
});
