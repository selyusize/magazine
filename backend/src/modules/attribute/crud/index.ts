import { defineCRUD } from "@shared/crud/define-crud";
import type { CRUDRow } from "@shared/crud/definition";
import { numberOr, oneOf, text, textOrNull, toDate } from "@shared/query/narrow";

import { ATTRIBUTE_MODULE } from "../index";
import type { AttributeDTO } from "./dto";
import { ATTRIBUTE_TYPES, CreateAttributeSchema, UpdateAttributeSchema } from "./schema";

const toAttributeDTO = (row: CRUDRow): AttributeDTO => ({
  id: row.id,
  name: text(row.name),
  handle: text(row.handle),
  type: oneOf(row.type, ATTRIBUTE_TYPES, "string"),
  unit: textOrNull(row.unit),
  is_filterable: Boolean(row.is_filterable),
  is_visible: Boolean(row.is_visible),
  rank: numberOr(row.rank),
  created_at: toDate(row.created_at),
  updated_at: toDate(row.updated_at),
});

/**
 * CRUD характеристик для админки — /admin/attributes. Handle — код из названия, уникален; своей страницы у
 * характеристики нет, поэтому смена кода редиректов не ставит. Удаление уносит значения у товаров.
 */
export const attributeCRUD = defineCRUD<AttributeDTO>({
  entity: "attribute",
  module: ATTRIBUTE_MODULE,
  model: "Attribute",
  label: "характеристика",
  shopScoped: true,
  response: { one: "attribute", many: "attributes" },
  fields: [
    "id",
    "name",
    "handle",
    "type",
    "unit",
    "is_filterable",
    "is_visible",
    "rank",
    "created_at",
    "updated_at",
  ],
  search: ["name", "handle"],
  order: { rank: "ASC", name: "ASC" },
  handle: { from: "name" },
  schemas: { create: CreateAttributeSchema, update: UpdateAttributeSchema },
  toDTO: toAttributeDTO,
});
