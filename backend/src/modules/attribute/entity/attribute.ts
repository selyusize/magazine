import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

import { AttributeValue } from "./attribute-value";

/**
 * Характеристика товара («Материал», «Мощность, Вт»): источник фильтров каталога и `additionalProperty` в schema.org.
 * `handle` — код характеристики в адресах фильтров и в `filters` посадочных (`{ "material": ["hlopok"] }`).
 * Характеристика принадлежит магазину `shop_id`, код уникален внутри магазина.
 */
export const Attribute = model
  .define("attribute", {
    id: model.id({ prefix: "attr" }).primaryKey(),
    shop_id: model.text(),
    name: model.text().searchable(),
    handle: model.text(),
    type: model.enum(["string", "number", "boolean"]).default("string"),
    unit: model.text().nullable(),
    /** Показывать фильтром в каталоге. */
    is_filterable: model.boolean().default(false),
    /** Показывать в таблице характеристик на карточке. */
    is_visible: model.boolean().default(true),
    /** Порядок в таблице характеристик и в фильтрах. */
    rank: model.number().default(0),
    values: model.hasMany(() => AttributeValue, { mappedBy: "attribute" }),
  })
  .cascades({ delete: ["values"] })
  // Индекс начинается с `shop_id` — он же для списков магазина
  .indexes([{ on: ["shop_id", "handle"], unique: true }]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type AttributeEntity = InferTypeOf<typeof Attribute>;
