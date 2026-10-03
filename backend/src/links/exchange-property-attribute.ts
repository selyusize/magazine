import { defineLink } from "@medusajs/framework/utils";

import AttributeModule from "../modules/attribute";
import ExchangeModule from "../modules/exchange";

/** Характеристика магазина свойства поставщика (read-only по `attribute_id`): `exchange_property.attribute`. */
export default defineLink(
  { linkable: ExchangeModule.linkable.exchangeProperty, field: "attribute_id" },
  AttributeModule.linkable.attribute,
  { readOnly: true },
);
