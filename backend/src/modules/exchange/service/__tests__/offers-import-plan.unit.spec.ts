import type { CMLOffer } from "../commerceml/types";
import type { ImportedProduct } from "../imported-product";
import { optionsKey } from "../offer-plan";
import { type OffersImportState, planOffersImport, uniqueHandle } from "../offers-import-plan";

const data = (overrides: Partial<ImportedProduct> = {}): ImportedProduct => ({
  external_id: "p1",
  title: "Кроссовки Air Max",
  description: null,
  sku: "AM-90",
  barcode: null,
  group_ids: [],
  category_id: null,
  images: [],
  brand: "Nike",
  attributes: [],
  properties: {},
  weight: 800,
  deleted: false,
  ...overrides,
});

const offer = (external_id: string, size: string | null, overrides: Partial<CMLOffer> = {}): CMLOffer => ({
  external_id,
  product_external_id: external_id.split("#")[0],
  name: null,
  sku: null,
  barcode: null,
  characteristics: size ? [{ name: "Размер", value: size }] : [],
  prices: [{ price_type_id: "pt", amount: 1000 }],
  quantity: 3,
  deleted: false,
  ...overrides,
});

const state = (overrides: Partial<OffersImportState> = {}): OffersImportState => ({
  staged: { p1: { id: "exprod_1", product_id: null, is_owner: false, is_deleted: false, data: data() } },
  offer_variants: {},
  products: {},
  duplicates: {},
  taken_handles: [],
  currency_code: "rub",
  sales_channel_id: "sc_1",
  shipping_profile_id: "sp_1",
  ...overrides,
});

const settings = { purchase_price_type: "pt", retail_price_type: null, markup_percent: 50 };
const plan = (offers: CMLOffer[], s: OffersImportState) =>
  planOffersImport({ offers, settings, price_types: [], state: s });

describe("planOffersImport", () => {
  it("новый товар: черновик с опциями, вариантами, розничной ценой, каналом и профилем доставки", () => {
    const result = plan([offer("p1#42", "42"), offer("p1#43", "43")], state({ taken_handles: ["krossovki-air-max"] }));

    expect(result.create).toEqual([
      {
        external_id: "p1",
        product: {
          title: "Кроссовки Air Max",
          handle: "krossovki-air-max-2",
          status: "draft",
          options: [{ title: "Размер", values: ["42", "43"] }],
          variants: [
            { title: "42", options: { Размер: "42" }, manage_inventory: true, prices: [{ amount: 1500, currency_code: "rub" }] },
            { title: "43", options: { Размер: "43" }, manage_inventory: true, prices: [{ amount: 1500, currency_code: "rub" }] },
          ],
          sales_channels: [{ id: "sc_1" }],
          shipping_profile_id: "sp_1",
          weight: 800,
        },
      },
    ]);
    expect(result.links).toEqual([{ row_id: "exprod_1", external_id: "p1", product_id: null, is_owner: true }]);
    expect(result.offers).toEqual([
      {
        external_id: "p1#42",
        variant: { product_external_id: "p1", title: "42" },
        sku: "AM-90",
        barcode: null,
        purchase_price: 1000,
        quantity: 3,
      },
      expect.objectContaining({ external_id: "p1#43", variant: { product_external_id: "p1", title: "43" } }),
    ]);
  });

  it("своя карточка: предложение к варианту по прежней связи или опциям, цена меняется, новый вариант — отложен", () => {
    const result = plan(
      [offer("p1#42", "42"), offer("p1#43", "43"), offer("p1#44", "44")],
      state({
        staged: { p1: { id: "exprod_1", product_id: "prod_1", is_owner: true, is_deleted: false, data: data() } },
        offer_variants: { "p1#42": "var_42" },
        products: {
          prod_1: {
            variants: [
              { id: "var_42", options_key: optionsKey({ Размер: "42" }), barcodes: [], price: 1500 },
              { id: "var_43", options_key: optionsKey({ Размер: "43" }), barcodes: [], price: 1200 },
            ],
          },
        },
      }),
    );

    expect(result.create).toEqual([]);
    expect(result.links).toEqual([]);
    expect(result.offers.map((planned) => planned.variant)).toEqual([{ variant_id: "var_42" }, { variant_id: "var_43" }]);
    expect(result.prices).toEqual([{ variant_id: "var_43", amount: 1500 }]);
    expect(result.deferred).toEqual([{ product_id: "prod_1", external_id: "p1", offers: [expect.objectContaining({ external_id: "p1#44" })] }]);
  });

  it("дубль у другого поставщика: склейка без новой карточки, вариант по штрихкоду, цену не трогает", () => {
    const result = plan(
      [offer("p1", null, { barcode: "4600000000017" })],
      state({
        duplicates: { p1: "prod_other" },
        products: {
          prod_other: {
            variants: [
              { id: "var_a", options_key: "x", barcodes: ["111"], price: 900 },
              { id: "var_b", options_key: "y", barcodes: ["4600000000017"], price: 900 },
            ],
          },
        },
      }),
    );

    expect(result.create).toEqual([]);
    expect(result.links).toEqual([{ row_id: "exprod_1", external_id: "p1", product_id: "prod_other", is_owner: false }]);
    expect(result.offers[0].variant).toEqual({ variant_id: "var_b" });
    expect(result.prices).toEqual([]);
    expect(result.deferred).toEqual([]);
  });

  it("нет в каталоге — ошибка; удалённый товар — существующим предложениям остаток 0", () => {
    const result = plan(
      [offer("unknown#1", "1"), offer("p1#42", "42"), offer("p1#43", "43")],
      state({
        staged: { p1: { id: "exprod_1", product_id: "prod_1", is_owner: true, is_deleted: true, data: data() } },
        offer_variants: { "p1#42": "var_42" },
      }),
    );

    expect(result.errors).toEqual([{ external_id: "unknown#1", message: "товара нет в каталоге поставщика (import.xml)" }]);
    expect(result.offers).toEqual([expect.objectContaining({ external_id: "p1#42", variant: { variant_id: "var_42" }, quantity: 0 })]);
  });

  it("остаток не пришёл (prices.xml) — null, прежний не трогаем; удалённое предложение — 0, новой карточке не вариант", () => {
    const fresh = plan([offer("p1#42", "42", { quantity: null }), offer("p1#43", "43", { deleted: true })], state());
    expect(fresh.offers.map((planned) => [planned.external_id, planned.quantity])).toEqual([["p1#42", null]]);
    expect(fresh.create[0].product.variants.map((variant) => variant.title)).toEqual(["42"]);

    const linked = plan(
      [offer("p1#43", "43", { deleted: true })],
      state({
        staged: { p1: { id: "exprod_1", product_id: "prod_1", is_owner: true, is_deleted: false, data: data() } },
        offer_variants: { "p1#43": "var_43" },
        products: { prod_1: { variants: [{ id: "var_43", options_key: optionsKey({ Размер: "43" }), barcodes: [], price: 1500 }] } },
      }),
    );
    expect(linked.offers).toEqual([expect.objectContaining({ variant: { variant_id: "var_43" }, quantity: 0 })]);
  });
});

describe("uniqueHandle", () => {
  it("свободный slug и запоминает выданный", () => {
    const taken = new Set(["kedy"]);
    expect(uniqueHandle("Кеды", taken)).toBe("kedy-2");
    expect(uniqueHandle("Кеды", taken)).toBe("kedy-3");
    expect(uniqueHandle("!!!", taken)).toBe("product");
  });
});
