import { defineCRUD } from "@shared/crud/define-crud";
import type { CRUDRow } from "@shared/crud/definition";

import { FILTER_PAGE_MODULE } from "../index";
import type { FilterPageDTO } from "./dto";
import { CreateFilterPageSchema, UpdateFilterPageSchema } from "./schema";

const toFilterPageDTO = (row: CRUDRow): FilterPageDTO => {
  const category = row.product_category as
    { name: string; handle: string } | null | undefined;
  return {
    id: row.id,
    category_id: String(row.category_id),
    category: category
      ? { name: category.name, handle: category.handle }
      : null,
    title: String(row.title),
    handle: String(row.handle),
    filters: (row.filters as Record<string, string[]> | null) ?? {},
    is_active: Boolean(row.is_active),
    created_at: new Date(row.created_at as string),
    updated_at: new Date(row.updated_at as string),
  };
};

/**
 * CRUD посадочных для админки — /admin/filter-pages. Handle — slug из названия, уникален внутри категории;
 * события `filter_page.*` → редиректы. Категория — через read-only связь `src/links/filter-page-product-category.ts`.
 */
export const filterPageCRUD = defineCRUD<FilterPageDTO>({
  entity: "filter_page",
  module: FILTER_PAGE_MODULE,
  model: "FilterPage",
  label: "посадочная",
  response: { one: "filter_page", many: "filter_pages" },
  fields: [
    "id",
    "category_id",
    "product_category.name",
    "product_category.handle",
    "title",
    "handle",
    "filters",
    "is_active",
    "created_at",
    "updated_at",
  ],
  search: ["title", "handle"],
  filters: ["category_id"],
  handle: { from: "title", scope: ["category_id"] },
  schemas: { create: CreateFilterPageSchema, update: UpdateFilterPageSchema },
  toDTO: toFilterPageDTO,
});
