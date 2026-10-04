import { defineCRUD } from "@shared/crud/define-crud";
import type { CRUDRow } from "@shared/crud/definition";
import { text, textOrNull, texts, toDate } from "@shared/query/narrow";

import { BRAND_MODULE } from "../index";
import type { BrandDTO } from "./dto";
import { CreateBrandSchema, UpdateBrandSchema } from "./schema";

const toBrandDTO = (row: CRUDRow): BrandDTO => ({
  id: row.id,
  name: text(row.name),
  handle: text(row.handle),
  description: textOrNull(row.description),
  is_active: Boolean(row.is_active),
  synonyms: texts(row.synonyms),
  created_at: toDate(row.created_at),
  updated_at: toDate(row.updated_at),
});

/** CRUD брендов для админки — /admin/brands. Handle — slug из названия, события `brand.*` → редиректы. */
export const brandCRUD = defineCRUD<BrandDTO>({
  entity: "brand",
  module: BRAND_MODULE,
  model: "Brand",
  label: "бренд",
  shopScoped: true,
  response: { one: "brand", many: "brands" },
  fields: [
    "id",
    "name",
    "handle",
    "description",
    "is_active",
    "synonyms",
    "created_at",
    "updated_at",
  ],
  search: ["name", "handle"],
  order: { name: "ASC" },
  handle: { from: "name" },
  schemas: { create: CreateBrandSchema, update: UpdateBrandSchema },
  toDTO: toBrandDTO,
});
