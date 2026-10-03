import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

import { Attribute } from "./attribute";

/**
 * Значение характеристики у товара (`variant_id = null`) или у его варианта. Значений одной характеристики может
 * быть несколько («Сезон: лето, демисезон»). `handle` — slug значения для адреса фильтра, `number` — значение
 * числовой характеристики для диапазонов.
 */
export const AttributeValue = model
  .define("attribute_value", {
    id: model.id({ prefix: "attrval" }).primaryKey(),
    attribute: model.belongsTo(() => Attribute, { mappedBy: "values" }),
    product_id: model.text().index(),
    variant_id: model.text().index().nullable(),
    value: model.text(),
    handle: model.text(),
    number: model.float().nullable(),
  })
  .indexes([{ on: ["attribute_id", "handle"] }]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type AttributeValueEntity = InferTypeOf<typeof AttributeValue>;
