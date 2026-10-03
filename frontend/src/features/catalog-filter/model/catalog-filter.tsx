"use client";

import { CatalogFilterView, type CatalogFilterContent } from "../ui/catalog-filter-view";
import { useCatalogFilter, type UseCatalogFilterOptions } from "./use-catalog-filter";

export type CatalogFilterProps = CatalogFilterContent & UseCatalogFilterOptions;

// Связка: черновик фильтров из model + «тупая» шторка из ui. Тексты и группы передаёт страница каталога.
export function CatalogFilter({ groups, applied, baseHref, ...content }: CatalogFilterProps) {
  return <CatalogFilterView {...content} {...useCatalogFilter({ groups, applied, baseHref })} />;
}
