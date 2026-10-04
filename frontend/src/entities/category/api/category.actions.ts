"use server";

import { cacheTags, getProductCategories } from "@shared/api";

import { CATEGORY_FIELDS, CATEGORY_LINK_FIELDS } from "../config/fields";
import { fromStoreCategory, toCategoryLinks } from "../model/from-store-category";
import type { Category, CategoryLink } from "../model/types";

/** TTL — страховка: категории обновляет вебхук ревалидации по тегам. */
const REVALIDATE_SECONDS = 300;

/** Категория по handle из URL (/catalog/[handle]). Нет такой — null: страница отдаёт 404. */
export async function getCategoryByHandle(handle: string): Promise<Category | null> {
  const { productCategories: categories } = await getProductCategories(
    { handle, fields: CATEGORY_FIELDS, limit: 1 },
    { next: { revalidate: REVALIDATE_SECONDS, tags: [cacheTags.categories, cacheTags.category(handle)] } },
  );
  return categories[0] ? fromStoreCategory(categories[0]) : null;
}

/** Категории верхнего уровня: чипсы на странице всего каталога (/catalog). */
export async function listRootCategories(): Promise<CategoryLink[]> {
  const { productCategories: categories } = await getProductCategories(
    { parentCategoryId: "null", fields: CATEGORY_LINK_FIELDS, limit: 50 },
    { next: { revalidate: REVALIDATE_SECONDS, tags: [cacheTags.categories, cacheTags.navigation] } },
  );
  return toCategoryLinks(categories);
}
