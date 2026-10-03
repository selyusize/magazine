import type { CRUDResource } from "../crud/types";
import { ATTRIBUTE_TYPES } from "./types";

/** Характеристики — /admin/attributes. Код (handle) — в адресах фильтров и в фильтрах посадочных. */
export const attributesResource: CRUDResource = {
  path: "/admin/attributes",
  response: { one: "attribute", many: "attributes" },
  i18n: "attributes",
  title: "name",
  columns: [
    { key: "name" },
    { key: "handle", kind: "mono" },
    { key: "type", kind: "badge" },
    { key: "unit" },
    { key: "is_filterable", kind: "boolean" },
    { key: "is_visible", kind: "boolean" },
  ],
  fields: [
    { name: "name", type: "text", required: true },
    { name: "handle", type: "text", placeholder: "material" },
    {
      name: "type",
      type: "select",
      options: ATTRIBUTE_TYPES,
      default: "string",
    },
    { name: "unit", type: "text", nullable: true, placeholder: "Вт" },
    { name: "is_filterable", type: "boolean", default: false },
    { name: "is_visible", type: "boolean", default: true },
    { name: "rank", type: "number", default: 0, min: 0 },
  ],
};
