import { createReadStream } from "node:fs";
import path from "node:path";

import { parseNumber } from "../parse";
import { type CMLRecord, readCommerceML } from "../reader";

const FIXTURES = path.resolve(__dirname, "../../../../../../integration-tests/fixtures/commerceml");

const read = async (file: string) => {
  const records: CMLRecord[] = [];
  for await (const record of readCommerceML(createReadStream(path.join(FIXTURES, file)))) records.push(record);
  return records;
};

const ofKind = <K extends CMLRecord["kind"]>(records: CMLRecord[], kind: K) =>
  records.filter((record): record is Extract<CMLRecord, { kind: K }> => record.kind === kind);

describe("readCommerceML: import.xml (2.05)", () => {
  it("классификатор: вложенные группы плоским списком, свойства со справочниками", async () => {
    const records = await read("import.xml");

    expect(ofKind(records, "groups")[0].groups).toEqual([
      { external_id: "grp-shoes", parent_external_id: null, name: "Обувь" },
      { external_id: "grp-sneakers", parent_external_id: "grp-shoes", name: "Кеды и кроссовки" },
      { external_id: "grp-misc", parent_external_id: null, name: "Разное" },
    ]);
    expect(ofKind(records, "properties")[0].properties).toEqual([
      { external_id: "prop-brand", name: "Бренд", values: { "val-nike": "NIKE", "val-puma": "Puma" } },
      { external_id: "prop-material", name: "Материал", values: { "val-leather": "Кожа", "val-textile": "Текстиль" } },
      { external_id: "prop-country", name: "Страна производства", values: {} },
    ]);
    expect(ofKind(records, "package")).toEqual([{ kind: "package", only_changes: false }]);
  });

  it("товары: картинки, группы, свойства, реквизиты, изготовитель; без названия — invalid", async () => {
    const records = await read("import.xml");
    const products = ofKind(records, "product").map((record) => record.product);

    expect(products.map((product) => product.external_id)).toEqual(["prd-airmax", "prd-suede", "prd-laces"]);
    expect(products[0]).toEqual({
      external_id: "prd-airmax",
      name: "Кроссовки Air Max 90",
      description: "Классические кроссовки с воздушной подушкой.",
      sku: "AM-90",
      barcode: null,
      group_ids: ["grp-sneakers"],
      images: ["import_files/ab/airmax-1.jpg", "import_files/ab/airmax-2.jpg"],
      manufacturer: null,
      properties: [
        { property_id: "prop-brand", value: "val-nike" },
        { property_id: "prop-material", value: "val-leather" },
        { property_id: "prop-country", value: "Вьетнам" },
      ],
      requisites: [
        { name: "ВидНоменклатуры", value: "Товар" },
        { name: "Вес", value: "0,8" },
      ],
      deleted: false,
    });
    expect(products[1]).toEqual(expect.objectContaining({ barcode: "4600000000017", manufacturer: "Puma" }));
    expect(ofKind(records, "invalid")).toEqual([{ kind: "invalid", message: "товар без Ид или названия" }]);
  });
});

describe("readCommerceML: offers.xml", () => {
  it("типы цен и предложения: характеристики, цены с пробелами и запятой, остатки по складам", async () => {
    const records = await read("offers.xml");

    expect(ofKind(records, "price_types")[0].price_types).toEqual([
      { external_id: "pt-purchase", name: "Оптовая", currency: "RUB" },
      { external_id: "pt-retail", name: "Розничная", currency: "RUB" },
    ]);
    const offers = ofKind(records, "offer").map((record) => record.offer);
    expect(offers[0]).toEqual({
      external_id: "prd-airmax#chr-42",
      product_external_id: "prd-airmax",
      name: "Кроссовки Air Max 90 (42)",
      sku: "AM-90",
      barcode: "4600000000420",
      characteristics: [{ name: "Размер", value: "42" }],
      prices: [
        { price_type_id: "pt-purchase", amount: 6000 },
        { price_type_id: "pt-retail", amount: 9990 },
      ],
      quantity: 5,
      deleted: false,
    });
    expect(offers.map((offer) => offer.quantity)).toEqual([5, 3, 7, 0, 1]);
    expect(offers[2].prices).toEqual([{ price_type_id: "pt-purchase", amount: 3500.5 }]);
    expect(offers[4].prices).toEqual([]);
  });

  it("пакет изменений 2.10: только изменения, остатки из Остатки/Остаток/Склад", async () => {
    const records = await read("offers-changes-2.10.xml");

    expect(ofKind(records, "package")).toEqual([{ kind: "package", only_changes: true }]);
    expect(ofKind(records, "offer")[0].offer).toEqual(
      expect.objectContaining({ external_id: "prd-airmax#chr-42", quantity: 3, characteristics: [] }),
    );
  });

  it("удалённые товар и предложение: Статус и ПометкаУдаления", async () => {
    const xml = `<?xml version="1.0"?><КоммерческаяИнформация>
      <Каталог><Товары><Товар Статус="Удален"><Ид>p1</Ид><Наименование>A</Наименование></Товар></Товары></Каталог>
      <ПакетПредложений><Предложения><Предложение><Ид>p2</Ид><ПометкаУдаления>true</ПометкаУдаления></Предложение></Предложения></ПакетПредложений>
    </КоммерческаяИнформация>`;
    const records: CMLRecord[] = [];
    for await (const record of readCommerceML([xml])) records.push(record);

    expect(ofKind(records, "product")[0].product.deleted).toBe(true);
    expect(ofKind(records, "offer")[0].offer.deleted).toBe(true);
    expect(ofKind(records, "offer")[0].offer.quantity).toBeNull();
  });
});

describe("parseNumber", () => {
  it("пробелы, неразрывные пробелы и запятая", () => {
    expect(parseNumber("1 234,50")).toBe(1234.5);
    expect(parseNumber("1 000")).toBe(1000);
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber(null)).toBeNull();
  });
});
