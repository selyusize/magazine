import type { CMLOffer } from "../commerceml/types";
import { planNewVariants } from "../variants-plan";

const offer = (external_id: string, characteristics: CMLOffer["characteristics"]): CMLOffer => ({
  external_id,
  product_external_id: "p",
  name: null,
  sku: null,
  barcode: null,
  characteristics,
  prices: [{ price_type_id: "pt", amount: 100 }],
  quantity: 1,
  deleted: false,
});

const base = {
  currency_code: "rub",
  settings: { purchase_price_type: "pt", retail_price_type: null, markup_percent: 0 },
  price_types: [],
};

describe("planNewVariants", () => {
  it("добавляет значения опциям и варианты с ценой; недостающая характеристика — «—»", () => {
    const plan = planNewVariants({
      ...base,
      offers: [offer("p#44", [{ name: "размер", value: "44" }])],
      options: [
        { id: "opt_size", title: "Размер", values: ["42", "43"] },
        { id: "opt_color", title: "Цвет", values: ["Белый"] },
      ],
      variant_titles: ["42 / Белый"],
    });

    expect(plan.option_values).toEqual([
      { product_option_id: "opt_size", add: ["44"] },
      { product_option_id: "opt_color", add: ["—"] },
    ]);
    expect(plan.variants).toEqual([
      {
        external_id: "p#44",
        title: "44 / —",
        options: { Размер: "44", Цвет: "—" },
        prices: [{ amount: 100, currency_code: "rub" }],
        purchase_price: 100,
      },
    ]);
    expect(plan.errors).toEqual([]);
  });

  it("новая характеристика — ошибка; занятое сочетание опций — с номером в опции и названии", () => {
    const plan = planNewVariants({
      ...base,
      offers: [offer("p#x", [{ name: "Цвет", value: "Синий" }]), offer("p#y", [])],
      options: [{ id: "opt", title: "Вариант", values: ["Основной"] }],
      variant_titles: ["Основной"],
    });

    expect(plan.errors).toEqual([
      { external_id: "p#x", message: "у товара новая характеристика «Цвет» — вариант нужно добавить вручную" },
    ]);
    expect(plan.variants.map((variant) => [variant.title, variant.options])).toEqual([
      ["Основной (2)", { Вариант: "Основной (2)" }],
    ]);
    expect(plan.option_values).toEqual([{ product_option_id: "opt", add: ["Основной (2)"] }]);
  });
});
