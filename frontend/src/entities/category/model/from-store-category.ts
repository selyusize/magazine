import type { StoreProductCategory } from "@shared/api";
import { routes } from "@shared/config";

import type { Category, CategoryLink } from "./types";

type StoreCategoryLink = Pick<StoreProductCategory, "id" | "name" | "handle"> & { rank?: number };

const byRank = (a: StoreCategoryLink, b: StoreCategoryLink) => (a.rank ?? 0) - (b.rank ?? 0);

export function toCategoryLink({ id, name, handle }: StoreCategoryLink): CategoryLink {
  return { id, name, handle, href: routes.category(handle) };
}

/** Категория Medusa → данные страницы. Единственное место, которое знает форму ответа /store/product-categories. */
export function fromStoreCategory(category: StoreProductCategory): Category {
  const parent = category.parentCategory as StoreCategoryLink | null | undefined;
  const children = (category.categoryChildren ?? []) as StoreCategoryLink[];

  return {
    ...toCategoryLink(category),
    description: category.description || undefined,
    parent: parent ? toCategoryLink(parent) : undefined,
    children: [...children].sort(byRank).map(toCategoryLink),
  };
}

/** Список категорий Medusa → ссылки по rank */
export function toCategoryLinks(categories: StoreCategoryLink[]): CategoryLink[] {
  return [...categories].sort(byRank).map(toCategoryLink);
}
