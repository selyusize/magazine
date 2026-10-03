import type { CMLProduct } from "../commerceml/types";
import {
  contentHash,
  ImportedProductSchema,
  type PropertyMapping,
  resolveCategoryId,
  toImportedProduct,
} from "../imported-product";

const product = (overrides: Partial<CMLProduct> = {}): CMLProduct => ({
  external_id: "p1",
  name: "  Кроссовки   Air Max ",
  description: "Описание",
  sku: "AM-90",
  barcode: null,
  group_ids: ["g1"],
  images: ["a.jpg", "a.jpg", "b.jpg"],
  manufacturer: null,
  properties: [],
  requisites: [],
  deleted: false,
  ...overrides,
});

const groups = new Map([["g1", { parent_external_id: null, category_id: "pcat_1" }]]);
const properties = new Map<string, PropertyMapping>([
  ["brand", { name: "Бренд", values: { v1: "NIKE" }, attribute_id: null }],
  ["material", { name: "Материал", values: { m1: "Кожа" }, attribute_id: "attr_material" }],
  ["country", { name: "Страна", values: {}, attribute_id: null }],
  ["tm", { name: "Торговая марка", values: {}, attribute_id: null }],
]);

describe("toImportedProduct", () => {
  it("раскрывает справочники, раскладывает свойства на характеристики и прочие, ищет бренд", () => {
    const imported = toImportedProduct(
      product({
        properties: [
          { property_id: "brand", value: "v1" },
          { property_id: "material", value: "m1" },
          { property_id: "country", value: "Вьетнам" },
          { property_id: "country", value: "Китай" },
          { property_id: "unknown", value: "x" },
        ],
        requisites: [{ name: "Вес", value: "0,8" }],
      }),
      { properties, groups, brand_property: null },
    );

    expect(imported).toEqual({
      external_id: "p1",
      title: "Кроссовки Air Max",
      description: "Описание",
      sku: "AM-90",
      barcode: null,
      group_ids: ["g1"],
      category_id: "pcat_1",
      images: ["a.jpg", "b.jpg"],
      brand: "NIKE",
      attributes: [{ attribute_id: "attr_material", value: "Кожа" }],
      properties: { Страна: "Вьетнам, Китай", unknown: "x" },
      weight: 800,
      deleted: false,
    });
  });

  it("бренд: свойство из настроек → «Бренд» → «Торговая марка» → реквизит → изготовитель", () => {
    const context = { properties, groups, brand_property: "Страна" };
    expect(
      toImportedProduct(product({ properties: [{ property_id: "brand", value: "v1" }, { property_id: "country", value: "Свой" }] }), context)
        .brand,
    ).toBe("Свой");
    expect(
      toImportedProduct(product({ properties: [{ property_id: "tm", value: "Puma" }], manufacturer: "Изг" }), {
        properties,
        groups,
        brand_property: null,
      }).brand,
    ).toBe("Puma");
    expect(
      toImportedProduct(product({ requisites: [{ name: "Производитель", value: "Adidas" }], manufacturer: "Изг" }), {
        properties,
        groups,
        brand_property: null,
      }).brand,
    ).toBe("Adidas");
    expect(toImportedProduct(product({ manufacturer: "Изг" }), { properties, groups, brand_property: null }).brand).toBe("Изг");
  });
});

describe("contentHash", () => {
  it("не зависит от порядка ключей, меняется с содержимым", () => {
    const a = toImportedProduct(product(), { properties, groups, brand_property: null });
    const reordered = ImportedProductSchema.parse(Object.fromEntries(Object.entries(a).reverse()));

    expect(contentHash(reordered)).toBe(contentHash(a));
    expect(contentHash({ ...a, title: "Другое" })).not.toBe(contentHash(a));
  });
});

describe("resolveCategoryId", () => {
  const groups = new Map([
    ["shoes", { parent_external_id: null, category_id: "pcat_shoes" }],
    ["sneakers", { parent_external_id: "shoes", category_id: null }],
    ["misc", { parent_external_id: null, category_id: null }],
    ["loop", { parent_external_id: "loop", category_id: null }],
  ]);

  it("своя группа, иначе ближайший сопоставленный предок; нет — null", () => {
    expect(resolveCategoryId(["sneakers"], groups)).toBe("pcat_shoes");
    expect(resolveCategoryId(["misc", "sneakers"], groups)).toBe("pcat_shoes");
    expect(resolveCategoryId(["misc"], groups)).toBeNull();
    expect(resolveCategoryId(["loop", "unknown"], groups)).toBeNull();
  });
});
