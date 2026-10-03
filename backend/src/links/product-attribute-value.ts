import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import AttributeModule from "../modules/attribute";

/**
 * Характеристики товара и его вариантов (read-only по `attribute_value.product_id`): Query отдаёт
 * `product.attribute_values.attribute` — таблица характеристик на карточке и фильтры.
 */
export default defineLink(
  { linkable: ProductModule.linkable.product, field: "id" },
  {
    ...AttributeModule.linkable.attributeValue.id,
    primaryKey: "product_id",
  },
  // isList read-only связи берётся из опций, не из описания второй стороны
  { readOnly: true, isList: true },
);
