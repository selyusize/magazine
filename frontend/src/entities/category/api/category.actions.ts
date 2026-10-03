"use server";

import { getProductCategories } from "@shared/api";

import { CATEGORY_FIELDS, CATEGORY_LINK_FIELDS } from "../config/fields";
import { fromStoreCategory, toCategoryLinks } from "../model/from-store-category";
import type { Category, CategoryLink } from "../model/types";

const cache = { next: { revalidate: 300, tags: ["categories"] } };

/** Категория по handle из URL (/catalog/[handle]). Нет такой — null: страница отдаёт 404. */
export async function getCategoryByHandle(handle: string): Promise<Category | null> {
  const { productCategories: categories } = await getProductCategories(
    { handle, fields: CATEGORY_FIELDS, limit: 1 },
    cache,
  );
  return categories[0] ? fromStoreCategory(categories[0]) : null;
}

/** Категории верхнего уровня: чипсы на странице всего каталога (/catalog). */
export async function listRootCategories(): Promise<CategoryLink[]> {
  const { productCategories: categories } = await getProductCategories(
    { parentCategoryId: "null", fields: CATEGORY_LINK_FIELDS, limit: 50 },
    cache,
  );
  return toCategoryLinks(categories);
}
