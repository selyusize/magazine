import { defineCRUD } from "@shared/crud/define-crud";
import type { CRUDRow } from "@shared/crud/definition";

import { BRAND_MODULE } from "../index";
import type { BrandDTO } from "./dto";
import { CreateBrandSchema, UpdateBrandSchema } from "./schema";

const toBrandDTO = (row: CRUDRow): BrandDTO => ({
  id: row.id,
  name: String(row.name),
  handle: String(row.handle),
  description: (row.description as string | null) ?? null,
  is_active: Boolean(row.is_active),
  created_at: new Date(row.created_at as string),
  updated_at: new Date(row.updated_at as string),
});

/** CRUD брендов для админки — /admin/brands. Handle — slug из названия, события `brand.*` → редиректы. */
export const brandCRUD = defineCRUD<BrandDTO>({
  entity: "brand",
  module: BRAND_MODULE,
  model: "Brand",
  label: "бренд",
  response: { one: "brand", many: "brands" },
  fields: [
    "id",
    "name",
    "handle",
    "description",
    "is_active",
    "created_at",
    "updated_at",
  ],
  search: ["name", "handle"],
  order: { name: "ASC" },
  handle: { from: "name" },
  schemas: { create: CreateBrandSchema, update: UpdateBrandSchema },
  toDTO: toBrandDTO,
});
