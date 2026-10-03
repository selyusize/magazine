import { childOf, childrenOf, textOf } from "../xml-node";
import { detectXMLEncoding, readXMLRecords, type XMLRecord } from "../xml-record-reader";

/** Документ, порезанный на куски по `size` байт: так приходит файл из потока. */
async function* chunks(bytes: Buffer, size: number): AsyncGenerator<Buffer> {
  for (let start = 0; start < bytes.length; start += size) yield bytes.subarray(start, start + size);
}

const collect = async (source: Parameters<typeof readXMLRecords>[0], paths: Parameters<typeof readXMLRecords>[1]) => {
  const records: XMLRecord[] = [];
  for await (const record of readXMLRecords(source, paths)) records.push(record);
  return records;
};

const CATALOG = `<?xml version="1.0" encoding="UTF-8"?>
<КоммерческаяИнформация ВерсияСхемы="2.05">
  <Классификатор><Группы><Группа><Ид>g1</Ид><Наименование>Обувь</Наименование>
    <Группы><Группа><Ид>g2</Ид><Наименование>Кеды</Наименование></Группа></Группы>
  </Группа></Группы></Классификатор>
  <Каталог СодержитТолькоИзменения="false">
    <Товары>
      <Товар><Ид>p1</Ид><Наименование>Кеды &amp; слипоны</Наименование><Описание><![CDATA[<p>Хлопок</p>]]></Описание></Товар>
      <Товар><Ид>p2</Ид><Наименование>  Ботинки  </Наименование><Картинка>a.jpg</Картинка><Картинка>b.jpg</Картинка></Товар>
    </Товары>
  </Каталог>
</КоммерческаяИнформация>`;

describe("readXMLRecords", () => {
  it("вынимает записи по путям, вложенные группы целиком, заголовок каталога — только атрибуты", async () => {
    const records = await collect(chunks(Buffer.from(CATALOG), 7), [
      { path: "Классификатор/Группы" },
      { path: "Каталог", shallow: true },
      { path: "Каталог/Товары/Товар" },
    ]);

    expect(records.map((record) => record.path)).toEqual([
      "Классификатор/Группы",
      "Каталог",
      "Каталог/Товары/Товар",
      "Каталог/Товары/Товар",
    ]);
    const groups = records[0].node;
    const nested = childOf(childOf(childOf(groups, "Группа"), "Группы"), "Группа");
    expect(textOf(nested, "Наименование")).toBe("Кеды");
    expect(records[1].node).toEqual({
      name: "Каталог",
      attributes: { СодержитТолькоИзменения: "false" },
      text: "",
      children: [],
    });
    expect(textOf(records[2].node, "Наименование")).toBe("Кеды & слипоны");
    expect(textOf(records[2].node, "Описание")).toBe("<p>Хлопок</p>");
    expect(textOf(records[3].node, "Наименование")).toBe("Ботинки");
    expect(childrenOf(records[3].node, "Картинка").map((node) => node.text)).toEqual(["a.jpg", "b.jpg"]);
    expect(textOf(records[3].node, "Описание")).toBeNull();
  });

  it("читает windows-1251 из объявления, даже когда кириллица режется между кусками", async () => {
    const xml = CATALOG.replace("UTF-8", "windows-1251");
    const bytes = Buffer.from(new Uint8Array([...xml].map((char) => win1251(char))));

    const records = await collect(chunks(bytes, 3), [{ path: "Каталог/Товары/Товар" }]);
    expect(records.map((record) => textOf(record.node, "Наименование"))).toEqual(["Кеды & слипоны", "Ботинки"]);
  });

  it("сравнивает пути по локальным именам — префиксы пространств имён не мешают", async () => {
    const xml = `<?xml version="1.0"?><cml:КоммерческаяИнформация xmlns:cml="urn:1C.ru:commerceml_2">
      <cml:ПакетПредложений><cml:Предложения><cml:Предложение cml:Статус="Новый"><cml:Ид>o1</cml:Ид></cml:Предложение></cml:Предложения></cml:ПакетПредложений>
    </cml:КоммерческаяИнформация>`;

    const [record] = await collect([xml], [{ path: "ПакетПредложений/Предложения/Предложение" }]);
    expect(record.node.attributes).toEqual({ Статус: "Новый" });
    expect(textOf(record.node, "Ид")).toBe("o1");
  });

  it("битый XML — INVALID_DATA с местом ошибки", async () => {
    await expect(collect(["<a><b></a>"], [{ path: "b" }])).rejects.toMatchObject({
      type: "invalid_data",
      message: expect.stringContaining("XML:"),
    });
  });

  it("отдаёт записи по ходу чтения, не дожидаясь конца файла", async () => {
    const products = Array.from({ length: 1000 }, (_, i) => `<Товар><Ид>p${i}</Ид></Товар>`).join("");
    const xml = Buffer.from(`<?xml version="1.0"?><К><Каталог><Товары>${products}</Товары></Каталог></К>`);
    let read = 0;
    async function* counted() {
      for await (const chunk of chunks(xml, 1024)) {
        read += chunk.length;
        yield chunk;
      }
    }

    const reader = readXMLRecords(counted(), [{ path: "Каталог/Товары/Товар" }]);
    const first = await reader.next();
    if (first.done) throw new Error("ридер не отдал ни одной записи");
    expect(textOf(first.value.node, "Ид")).toBe("p0");
    expect(read).toBeLessThan(xml.length / 2);
  });
});

describe("detectXMLEncoding", () => {
  it("BOM и объявление; без них — UTF-8", () => {
    expect(detectXMLEncoding(Buffer.from([0xef, 0xbb, 0xbf, 0x3c]))).toBe("utf-8");
    expect(detectXMLEncoding(Buffer.from(`<?xml version="1.0" encoding='Windows-1251'?>`))).toBe("windows-1251");
    expect(detectXMLEncoding(Buffer.from("<root/>"))).toBe("utf-8");
    expect(() => detectXMLEncoding(Buffer.from(`<?xml encoding="koi9"?>`))).toThrow("неизвестная кодировка");
  });
});

/** Кодирование одного символа в windows-1251 (TextEncoder умеет только UTF-8). */
function win1251(char: string): number {
  const code = char.charCodeAt(0);
  if (code < 0x80) return code;
  if (char === "ё") return 0xb8;
  if (char === "Ё") return 0xa8;
  if (code >= 0x410 && code <= 0x44f) return code - 0x410 + 0xc0;
  throw new Error(`нет в тесте: ${char}`);
}
