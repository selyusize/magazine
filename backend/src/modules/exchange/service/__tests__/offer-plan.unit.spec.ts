import type { CMLOffer } from "../commerceml/types";
import { DEFAULT_OPTION, offerPrices, optionsKey, shapeProduct } from "../offer-plan";

const offer = (external_id: string, characteristics: CMLOffer["characteristics"] = [], prices: CMLOffer["prices"] = []): CMLOffer => ({
  external_id,
  product_external_id: external_id.split("#")[0],
  name: null,
  sku: null,
  barcode: null,
  characteristics,
  prices,
  quantity: 1,
  deleted: false,
});

describe("shapeProduct", () => {
  it("опции — объединение характеристик, недостающее значение — «—»", () => {
    const shape = shapeProduct([
      offer("p#1", [{ name: "Размер", value: "42" }]),
      offer("p#2", [
        { name: "Размер", value: "43" },
        { name: "Цвет", value: "Белый" },
      ]),
    ]);

    expect(shape.options).toEqual([
      { title: "Размер", values: ["42", "43"] },
      { title: "Цвет", values: ["—", "Белый"] },
    ]);
    expect(shape.variants.get("p#1")).toEqual({ title: "42 / —", options: { Размер: "42", Цвет: "—" } });
    expect(shape.variants.get("p#2")?.title).toBe("43 / Белый");
  });

  it("без характеристик — опция по умолчанию; одинаковые варианты не слипаются", () => {
    const shape = shapeProduct([offer("p"), offer("p#x")]);

    expect(shape.options).toEqual([
      { title: DEFAULT_OPTION.title, values: [DEFAULT_OPTION.value, `${DEFAULT_OPTION.value} (2)`] },
    ]);
    expect(shape.variants.get("p#x")?.title).toBe(`${DEFAULT_OPTION.value} (2)`);
  });
});

describe("optionsKey", () => {
  it("не зависит от порядка и регистра", () => {
    expect(optionsKey({ Размер: "M", Цвет: "Белый" })).toBe(optionsKey({ цвет: "белый", размер: "m" }));
  });
});

describe("offerPrices", () => {
  const types = [
    { external_id: "pt-1", name: "Оптовая", currency: "RUB" },
    { external_id: "pt-2", name: "Розничная", currency: "RUB" },
  ];
  const priced = offer("p", [], [
    { price_type_id: "pt-1", amount: 1000 },
    { price_type_id: "pt-2", amount: 1990 },
  ]);

  it("закупка и розница по названию или Ид типа цены", () => {
    expect(
      offerPrices(priced, { purchase_price_type: "оптовая", retail_price_type: "pt-2", markup_percent: 0 }, types),
    ).toEqual({ purchase: 1000, retail: 1990 });
  });

  it("без розничного типа — закупка + наценка, вверх до рубля; без настроек — первая цена", () => {
    expect(
      offerPrices(priced, { purchase_price_type: null, retail_price_type: null, markup_percent: 33.3 }, types),
    ).toEqual({ purchase: 1000, retail: 1333 });
    expect(
      offerPrices(offer("p"), { purchase_price_type: "pt-1", retail_price_type: null, markup_percent: 10 }, types),
    ).toEqual({ purchase: null, retail: null });
  });
});
