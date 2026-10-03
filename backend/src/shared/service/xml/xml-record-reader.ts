import { MedusaError } from "@medusajs/framework/utils";
import { SaxesParser } from "saxes";

import type { XMLNode } from "./xml-node";
import { errorMessage } from "@shared/service/error/error-message";

/**
 * Что вынимать из документа: путь элемента от корня без самого корня (`Каталог/Товары/Товар`).
 * `shallow` — отдать элемент сразу при открытии, только с атрибутами (заголовок вроде `<Каталог СодержитТолькоИзменения="true">`,
 * внутри которого лежат тысячи товаров).
 */
export type XMLRecordPath = { path: string; shallow?: boolean };

export type XMLRecord = { path: string; node: XMLNode };

/** Сколько байт смотреть в поиске `encoding="..."` в объявлении XML. */
const DECLARATION_BYTES = 512;

const localName = (name: string): string => name.slice(name.indexOf(":") + 1);

/**
 * Кодировка из BOM или объявления `<?xml ... encoding="windows-1251"?>`; по умолчанию UTF-8. 1С и МойСклад
 * отдают и то и другое, а старые выгрузки — ещё и в windows-1251 без BOM.
 */
export function detectXMLEncoding(head: Uint8Array): string {
  if (head[0] === 0xef && head[1] === 0xbb && head[2] === 0xbf) return "utf-8";
  if (head[0] === 0xff && head[1] === 0xfe) return "utf-16le";
  if (head[0] === 0xfe && head[1] === 0xff) return "utf-16be";

  const declaration = Buffer.from(head.subarray(0, DECLARATION_BYTES)).toString(
    "latin1",
  );
  const label = /<\?xml[^>]*encoding\s*=\s*["']([^"']+)["']/i.exec(
    declaration,
  )?.[1];
  if (!label) return "utf-8";
  try {
    return new TextDecoder(label).encoding;
  } catch {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `XML: неизвестная кодировка «${label}»`,
    );
  }
}

/**
 * Потоковое чтение XML: документ любого размера идёт кусками, в памяти — только текущая запись (один товар,
 * одно предложение). Следующий кусок читается, когда потребитель забрал готовые записи, — поэтому медленная запись
 * в БД сама притормаживает чтение файла.
 *
 * Пространства имён не важны: пути сравниваются по локальным именам (`cml:Товар` → `Товар`).
 */
export async function* readXMLRecords(
  source: AsyncIterable<Uint8Array | string> | Iterable<Uint8Array | string>,
  paths: XMLRecordPath[],
): AsyncGenerator<XMLRecord, void, undefined> {
  const targets = new Map(paths.map((target) => [target.path, target]));
  const ready: XMLRecord[] = [];
  const stack: string[] = [];
  /** Открытые элементы захватываемой записи: [корень записи, …, текущий]. */
  let open: XMLNode[] = [];
  let capturedPath = "";

  const parser = new SaxesParser();
  parser.on("opentag", (tag) => {
    const name = localName(tag.name);
    stack.push(name);
    const attributes = Object.fromEntries(
      Object.entries(tag.attributes).map(([key, value]) => [localName(key), value]),
    );
    const node: XMLNode = { name, attributes, text: "", children: [] };

    if (open.length) {
      open[open.length - 1].children.push(node);
      open.push(node);
      return;
    }

    const path = stack.slice(1).join("/");
    const target = targets.get(path);
    if (!target) return;
    if (target.shallow) {
      ready.push({ path, node });
      return;
    }
    open = [node];
    capturedPath = path;
  });
  const appendText = (text: string) => {
    if (open.length) open[open.length - 1].text += text;
  };
  parser.on("text", appendText);
  parser.on("cdata", appendText);
  parser.on("closetag", () => {
    stack.pop();
    const node = open.pop();
    if (!node) return;
    node.text = node.text.trim();
    if (!open.length) ready.push({ path: capturedPath, node });
  });

  const write = (text: string) => {
    try {
      parser.write(text);
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `XML: ${errorMessage(error)}`,
      );
    }
  };

  let decoder: TextDecoder | null = null;
  let head = Buffer.alloc(0);

  for await (const chunk of source) {
    const bytes =
      typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk;
    if (!decoder) {
      // Объявление может прийти разрезанным между кусками — копим начало файла
      head = Buffer.concat([head, bytes]);
      if (head.length < DECLARATION_BYTES) continue;
      decoder = new TextDecoder(detectXMLEncoding(head));
      write(decoder.decode(head, { stream: true }));
    } else {
      write(decoder.decode(bytes, { stream: true }));
    }
    yield* ready.splice(0);
  }

  if (!decoder) {
    decoder = new TextDecoder(detectXMLEncoding(head));
    write(decoder.decode(head, { stream: true }));
  }
  write(decoder.decode());
  try {
    parser.close();
  } catch (error) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `XML: ${errorMessage(error)}`,
    );
  }
  yield* ready.splice(0);
}
