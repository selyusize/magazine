import { childOf, childrenOf, textOf, type XMLNode } from "@shared/service/xml/xml-node";

import type {
  CMLCharacteristic,
  CMLGroup,
  CMLOffer,
  CMLPrice,
  CMLPriceType,
  CMLProduct,
  CMLProperty,
  CMLPropertyValue,
  CMLRequisite,
} from "./types";

/**
 * Чистые функции «элемент XML → запись CommerceML». Различия версий схемы 2.03–2.10 сведены здесь: старые и новые
 * имена элементов, флаги атрибутом и элементом, остатки в `Количество`, `Остатки` или `Склад`.
 */

/** «1 234,50» → 1234.5; пусто или мусор — `null`. */
export function parseNumber(text: string | null): number | null {
  if (!text) return null;
  const number = Number(text.replace(/[\s ]/g, "").replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

const isTrue = (text: string | null | undefined): boolean => (text ?? "").trim().toLowerCase() === "true";

/** Удалён у поставщика: `Статус="Удален"` (атрибут или элемент, 2.05+) или `ПометкаУдаления` (2.03). */
function isDeleted(node: XMLNode): boolean {
  const status = node.attributes["Статус"] ?? textOf(node, "Статус");
  return status === "Удален" || isTrue(textOf(node, "ПометкаУдаления"));
}

/** `СодержитТолькоИзменения` — атрибутом (2.03–2.07) или дочерним элементом (2.08+). */
export function containsOnlyChanges(node: XMLNode): boolean {
  return isTrue(node.attributes["СодержитТолькоИзменения"]) || isTrue(textOf(node, "СодержитТолькоИзменения"));
}

/** Дерево `Классификатор/Группы` → плоский список с родителем. */
export function parseGroups(groups: XMLNode, parent: string | null = null): CMLGroup[] {
  return childrenOf(groups, "Группа").flatMap((group) => {
    const id = textOf(group, "Ид");
    if (!id) return [];
    const self: CMLGroup = {
      external_id: id,
      parent_external_id: parent,
      name: textOf(group, "Наименование") ?? id,
    };
    return [self, ...parseGroups(childOf(group, "Группы") ?? emptyNode, id)];
  });
}

/** `Классификатор/Свойства`: `Свойство` (2.04+) или `СвойствоНоменклатуры` (2.03), справочник значений. */
export function parseProperties(properties: XMLNode): CMLProperty[] {
  return [...childrenOf(properties, "Свойство"), ...childrenOf(properties, "СвойствоНоменклатуры")].flatMap(
    (property) => {
      const id = textOf(property, "Ид");
      if (!id) return [];
      const values: Record<string, string> = {};
      for (const option of childrenOf(childOf(property, "ВариантыЗначений"), "Справочник")) {
        const valueId = textOf(option, "ИдЗначения") ?? textOf(option, "Ид");
        const value = textOf(option, "Значение");
        if (valueId && value) values[valueId] = value;
      }
      return [{ external_id: id, name: textOf(property, "Наименование") ?? id, values }];
    },
  );
}

/** Товар `Каталог/Товары/Товар`. Без `Ид` или названия — `null`: такой товар не сопоставить и не показать. */
export function parseProduct(node: XMLNode): CMLProduct | null {
  const id = textOf(node, "Ид");
  const name = textOf(node, "Наименование");
  if (!id || !name) return null;

  const properties: CMLPropertyValue[] = childrenOf(childOf(node, "ЗначенияСвойств"), "ЗначенияСвойства").flatMap(
    (property) => {
      const propertyId = textOf(property, "Ид");
      if (!propertyId) return [];
      return childrenOf(property, "Значение")
        .map((value) => value.text)
        .filter(Boolean)
        .map((value) => ({ property_id: propertyId, value }));
    },
  );
  const requisites: CMLRequisite[] = childrenOf(childOf(node, "ЗначенияРеквизитов"), "ЗначениеРеквизита").flatMap(
    (requisite) => {
      const requisiteName = textOf(requisite, "Наименование");
      const value = textOf(requisite, "Значение");
      return requisiteName && value ? [{ name: requisiteName, value }] : [];
    },
  );

  return {
    external_id: id,
    name,
    description: textOf(node, "Описание"),
    sku: textOf(node, "Артикул"),
    barcode: textOf(node, "Штрихкод") ?? requisiteValue(requisites, "Штрихкод"),
    group_ids: childrenOf(childOf(node, "Группы"), "Ид")
      .map((group) => group.text)
      .filter(Boolean),
    images: childrenOf(node, "Картинка")
      .map((image) => image.text)
      .filter(Boolean),
    manufacturer: textOf(node, "Изготовитель", "Наименование"),
    properties,
    requisites,
    deleted: isDeleted(node),
  };
}

/** Тип цены `ТипыЦен/ТипЦены`. */
export function parsePriceType(node: XMLNode): CMLPriceType | null {
  const id = textOf(node, "Ид");
  if (!id) return null;
  return {
    external_id: id,
    name: textOf(node, "Наименование") ?? id,
    currency: textOf(node, "Валюта"),
  };
}

/** Предложение `Предложения/Предложение`: `Ид` вида `товар#характеристика` → вариант товара. */
export function parseOffer(node: XMLNode): CMLOffer | null {
  const id = textOf(node, "Ид");
  if (!id) return null;

  const characteristics: CMLCharacteristic[] = childrenOf(
    childOf(node, "ХарактеристикиТовара"),
    "ХарактеристикаТовара",
  ).flatMap((characteristic) => {
    const name = textOf(characteristic, "Наименование");
    const value = textOf(characteristic, "Значение");
    return name && value ? [{ name, value }] : [];
  });
  const prices: CMLPrice[] = childrenOf(childOf(node, "Цены"), "Цена").flatMap((price) => {
    const priceTypeId = textOf(price, "ИдТипаЦены");
    const amount = parseNumber(textOf(price, "ЦенаЗаЕдиницу"));
    return priceTypeId && amount !== null ? [{ price_type_id: priceTypeId, amount }] : [];
  });

  return {
    external_id: id,
    product_external_id: id.split("#")[0],
    name: textOf(node, "Наименование"),
    sku: textOf(node, "Артикул"),
    barcode: textOf(node, "Штрихкод"),
    characteristics,
    prices,
    quantity: parseQuantity(node),
    deleted: isDeleted(node),
  };
}

/**
 * Остаток предложения во всех вариантах схемы: `Количество` (2.03–2.07), `Остатки/Остаток/Количество` и
 * `Остатки/Остаток/Склад/Количество` (2.08+), `Склад КоличествоНаСкладе="…"` (2.04–2.07). По складам — сумма,
 * отрицательные — ноль. Ничего нет — `null`.
 */
function parseQuantity(node: XMLNode): number | null {
  const stocks = childrenOf(childOf(node, "Остатки"), "Остаток");
  const amounts: (number | null)[] = stocks.length
    ? stocks.flatMap((stock) => {
        const warehouses = childrenOf(stock, "Склад");
        return warehouses.length
          ? warehouses.map((warehouse) => parseNumber(textOf(warehouse, "Количество")))
          : [parseNumber(textOf(stock, "Количество"))];
      })
    : childrenOf(node, "Склад").map((warehouse) => parseNumber(warehouse.attributes["КоличествоНаСкладе"] ?? null));

  const known = amounts.filter((amount): amount is number => amount !== null);
  if (known.length) return known.reduce((sum, amount) => sum + Math.max(0, amount), 0);

  const total = parseNumber(textOf(node, "Количество"));
  return total === null ? null : Math.max(0, total);
}

function requisiteValue(requisites: CMLRequisite[], name: string): string | null {
  return requisites.find((requisite) => requisite.name.toLowerCase() === name.toLowerCase())?.value ?? null;
}

const emptyNode: XMLNode = { name: "", attributes: {}, text: "", children: [] };
