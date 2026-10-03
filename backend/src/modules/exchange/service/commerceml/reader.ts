import { readXMLRecords } from "@shared/service/xml/xml-record-reader";

import {
  containsOnlyChanges,
  parseGroups,
  parseOffer,
  parsePriceType,
  parseProduct,
  parseProperties,
} from "./parse";
import type { CMLGroup, CMLOffer, CMLPriceType, CMLProduct, CMLProperty } from "./types";

/** Что встретилось в файле обмена — по порядку документа. */
export type CMLRecord =
  | { kind: "groups"; groups: CMLGroup[] }
  | { kind: "properties"; properties: CMLProperty[] }
  | { kind: "price_types"; price_types: CMLPriceType[] }
  /** Каталог или пакет предложений: `only_changes` — выгрузка содержит только изменения. */
  | { kind: "package"; only_changes: boolean }
  | { kind: "product"; product: CMLProduct }
  | { kind: "offer"; offer: CMLOffer }
  /** Запись без `Ид` или названия — пропускается, но попадает в лог запуска. */
  | { kind: "invalid"; message: string };

const OFFERS = ["ПакетПредложений", "ИзмененияПакетаПредложений"];

const PATHS = [
  { path: "Классификатор/Группы" },
  { path: "Классификатор/Свойства" },
  { path: "Классификатор/ТипыЦен" },
  { path: "Каталог", shallow: true },
  { path: "Каталог/СодержитТолькоИзменения" },
  { path: "Каталог/Товары/Товар" },
  ...OFFERS.flatMap((root) => [
    { path: root, shallow: true },
    { path: `${root}/СодержитТолькоИзменения` },
    { path: `${root}/ТипыЦен` },
    { path: `${root}/Предложения/Предложение` },
  ]),
];

/**
 * Файл обмена CommerceML (`import*.xml`, `offers*.xml`, `prices*.xml`, `rests*.xml`) → поток записей. Что за
 * файл, решает содержимое, а не имя: разбитые выгрузки называют файлы как угодно.
 */
export async function* readCommerceML(
  source: AsyncIterable<Uint8Array | string> | Iterable<Uint8Array | string>,
): AsyncGenerator<CMLRecord, void, undefined> {
  for await (const { path, node } of readXMLRecords(source, PATHS)) {
    switch (path) {
      case "Классификатор/Группы":
        yield { kind: "groups", groups: parseGroups(node) };
        continue;
      case "Классификатор/Свойства":
        yield { kind: "properties", properties: parseProperties(node) };
        continue;
      case "Каталог":
        yield { kind: "package", only_changes: containsOnlyChanges(node) };
        continue;
      case "Каталог/Товары/Товар": {
        const product = parseProduct(node);
        yield product ? { kind: "product", product } : { kind: "invalid", message: "товар без Ид или названия" };
        continue;
      }
    }

    if (path.endsWith("/ТипыЦен")) {
      const priceTypes = node.children.map(parsePriceType).filter((type): type is CMLPriceType => type !== null);
      yield { kind: "price_types", price_types: priceTypes };
    } else if (path.endsWith("/СодержитТолькоИзменения")) {
      if (node.text.toLowerCase() === "true") yield { kind: "package", only_changes: true };
    } else if (OFFERS.includes(path)) {
      // Пакет изменений предложений (2.08+) по определению содержит только изменения
      yield {
        kind: "package",
        only_changes: path === "ИзмененияПакетаПредложений" || containsOnlyChanges(node),
      };
    } else if (path.endsWith("/Предложения/Предложение")) {
      const offer = parseOffer(node);
      yield offer ? { kind: "offer", offer } : { kind: "invalid", message: "предложение без Ид" };
    }
  }
}
