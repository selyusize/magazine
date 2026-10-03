/**
 * Записи CommerceML 2 (2.03–2.10) после разбора — только данные, переживают JSON: идут во входы команд.
 * Разбор — `parse.ts`, чтение файла — `commerceml-reader.ts`.
 */

/** Группа каталога поставщика (`Классификатор/Группы/Группа`, вложенность — через `parent_external_id`). */
export type CMLGroup = {
  external_id: string;
  parent_external_id: string | null;
  name: string;
};

/** Свойство (`Классификатор/Свойства/Свойство`) и справочник его значений `{ ИдЗначения: значение }`. */
export type CMLProperty = {
  external_id: string;
  name: string;
  values: Record<string, string>;
};

/** Значение свойства у товара: `property_id` — Ид свойства, `value` — текст или Ид значения справочника. */
export type CMLPropertyValue = { property_id: string; value: string };

/** Реквизит товара (`ЗначенияРеквизитов`): «Вес» → «0,5», «Производитель» → «Nike». */
export type CMLRequisite = { name: string; value: string };

/** Товар `import.xml` (`Каталог/Товары/Товар`). */
export type CMLProduct = {
  external_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  group_ids: string[];
  /** Пути картинок в пакете (`import_files/ab/1.jpg`) или их URL. */
  images: string[];
  /** `Изготовитель/Наименование`. */
  manufacturer: string | null;
  properties: CMLPropertyValue[];
  requisites: CMLRequisite[];
  /** `Статус="Удален"` или `ПометкаУдаления=true`. */
  deleted: boolean;
};

/** Тип цены (`ТипыЦен/ТипЦены`): «Закупочная», «Розничная»… */
export type CMLPriceType = {
  external_id: string;
  name: string;
  currency: string | null;
};

export type CMLPrice = { price_type_id: string; amount: number };

/** Характеристика варианта (`ХарактеристикиТовара/ХарактеристикаТовара`): «Размер» → «M». */
export type CMLCharacteristic = { name: string; value: string };

/** Предложение `offers.xml` (а также `prices.xml`, `rests.xml`): вариант товара с ценами и остатком. */
export type CMLOffer = {
  /** Целиком: `товар#характеристика` или `товар`. */
  external_id: string;
  product_external_id: string;
  name: string | null;
  sku: string | null;
  barcode: string | null;
  characteristics: CMLCharacteristic[];
  prices: CMLPrice[];
  /** Сумма остатков по складам; `null` — в файле нет остатков (например, `prices.xml`), не трогаем. */
  quantity: number | null;
  deleted: boolean;
};
