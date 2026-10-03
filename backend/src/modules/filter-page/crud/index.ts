import { defineCRUD } from "@shared/crud/define-crud";
import type { CRUDRow } from "@shared/crud/definition";
import { recordOf, recordOrNull, text, texts, toDate } from "@shared/query/narrow";

import { FILTER_PAGE_MODULE } from "../index";
import type { FilterPageDTO } from "./dto";
import { CreateFilterPageSchema, UpdateFilterPageSchema } from "./schema";

const toFilterPageDTO = (row: CRUDRow): FilterPageDTO => {
  const category = recordOrNull(row.product_category);
  return {
    id: row.id,
    category_id: text(row.category_id),
    category: category
      ? { name: text(category.name), handle: text(category.handle) }
      : null,
    title: text(row.title),
    handle: text(row.handle),
    filters: Object.fromEntries(
      Object.entries(recordOf(row.filters)).map(([key, values]) => [key, texts(values)]),
    ),
    is_active: Boolean(row.is_active),
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
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
