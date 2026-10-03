import { defineCRUD } from "@shared/crud/define-crud";
import type { CRUDRow } from "@shared/crud/definition";

import { ATTRIBUTE_MODULE } from "../index";
import type { AttributeDTO } from "./dto";
import { CreateAttributeSchema, UpdateAttributeSchema } from "./schema";

const toAttributeDTO = (row: CRUDRow): AttributeDTO => ({
  id: row.id,
  name: String(row.name),
  handle: String(row.handle),
  type: row.type as AttributeDTO["type"],
  unit: (row.unit as string | null) ?? null,
  is_filterable: Boolean(row.is_filterable),
  is_visible: Boolean(row.is_visible),
  rank: Number(row.rank),
  created_at: new Date(row.created_at as string),
  updated_at: new Date(row.updated_at as string),
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
