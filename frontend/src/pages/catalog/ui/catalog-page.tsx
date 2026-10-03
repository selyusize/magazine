import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogFilter, countActive, filterGroups, filterQuery, filterSearchParams, parseFilters } from "@features/catalog-filter";
import { resolveSort, sortMenuItems, SortMenu } from "@features/catalog-sort";
import { Breadcrumbs } from "@widgets/breadcrumbs";
import { WishlistToggle } from "@features/wishlist-toggle";
import { getCategoryByHandle, listRootCategories, type Category, type CategoryLink } from "@entities/category";
import { getStoreCurrency, ProductGrid, searchPriceField, searchProducts, toCardProps } from "@entities/product";
import { routes, siteConfig } from "@shared/config";
import { Container } from "@shared/ui/container";
import { PagePagination } from "@shared/ui/page-pagination";

import { catalogHref, catalogParamsSchema } from "../model/params";
import { CatalogHeader, type CatalogChip } from "./catalog-header";

type CatalogPageProps = {
  /** handle нет — весь каталог (/catalog) */
  params: Promise<{ handle?: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Категория из URL. Неизвестный handle — 404 */
async function loadCategory(params: CatalogPageProps["params"]): Promise<Category | null> {
  const { handle } = await params;
  if (!handle) return null;
  const category = await getCategoryByHandle(handle);
  if (!category) notFound();
  return category;
}

/**
 * Чипсы: подкатегории текущей. У категории без подкатегорий — соседние (подкатегории родителя, у категории
 * верхнего уровня — другие категории верхнего уровня), текущая отмечена: по ним можно переключаться, не возвращаясь
 * назад, и ряд чипсов не пропадает — шапка не меняет высоту. В корне каталога — категории верхнего уровня.
 */
async function loadChips(category: Category | null): Promise<CatalogChip[]> {
  const toChip = (link: CategoryLink): CatalogChip => ({ label: link.name, href: link.href, active: link.id === category?.id });

  if (category?.children.length) return category.children.map(toChip);
  if (!category?.parent) return (await listRootCategories()).map(toChip);
  const parent = await getCategoryByHandle(category.parent.handle);
  return (parent?.children ?? []).map(toChip);
}

/** Товары категории вместе с подкатегориями. Индекс хранит категории товара по названию */
function categoryClause(category: Category | null): Record<string, unknown>[] {
  return category ? [{ category: { $in: [category.name, ...category.children.map((child) => child.name)] } }] : [];
}

/**
 * Сортировка и фильтры — варианты той же выдачи: в индекс не попадают, каноническая — страница без них.
 * Страницы пагинации индексируются, у каждой свой канонический адрес.
 */
export async function generateCatalogMetadata({ params, searchParams }: CatalogPageProps): Promise<Metadata> {
  const config = siteConfig.catalog;
  const category = await loadCategory(params);
  const query = await searchParams;
  const { page, sort } = catalogParamsSchema.parse(query);
  const filtered = countActive(parseFilters(query, config.filter?.items ?? [])) > 0;
  const path = category?.href ?? routes.catalog;
  const title = category?.name ?? config.title;

  return {
    title: page > 1 ? `${title} — страница ${page}` : title,
    description: category?.description ?? config.description,
    alternates: { canonical: catalogHref(path, { page }) },
    ...((sort || filtered) && { robots: { index: false, follow: true } }),
  };
}

/**
 * Страница каталога (Figma: Product Listing): весь каталог или категория. Рендерится на сервере.
 * Выдача — из поискового индекса: фильтры и счётчики значений для шторки одним запросом.
 */
export async function CatalogPage({ params, searchParams }: CatalogPageProps) {
  const config = siteConfig.catalog;
  const filters = config.filter?.items ?? [];
  const [category, query, currencyCode] = await Promise.all([loadCategory(params), searchParams, getStoreCurrency()]);
  const { page, sort: sortValue } = catalogParamsSchema.parse(query);
  const applied = parseFilters(query, filters);
  const index = { priceField: searchPriceField(currencyCode), currencyCode };
  const filterRequest = filterQuery(filters, applied, index);
  const filterParams = filterSearchParams(applied, filters);
  const sort = resolveSort(sortValue, config.sort);
  const path = category?.href ?? routes.catalog;
  // Неизвестный ?sort не плодит дубли: ссылки строятся только из вариантов конфига
  const sortParam = sort && sort !== config.sort[0] ? sort.value : undefined;

  const [chips, result] = await Promise.all([
    loadChips(category),
    searchProducts({
      filters: [...categoryClause(category), ...filterRequest.clauses],
      facets: filterRequest.facets,
      order: sort?.order,
      limit: config.pageSize,
      offset: (page - 1) * config.pageSize,
    }),
  ]);
  const totalPages = Math.ceil(result.count / config.pageSize);
  const groups = filterGroups(filters, applied, result.facets, index);
  const filtered = filterParams.length > 0;

  // Страница за пределами выдачи (?page=999) — 404, а не пустая страница с кодом 200
  if (page > 1 && page > totalPages) notFound();

  const breadcrumbs = [
    { name: config.title, href: routes.catalog },
    ...(category?.parent ? [{ name: category.parent.name, href: category.parent.href }] : []),
    ...(category ? [{ name: category.name, href: category.href }] : []),
  ];
  // В категории «назад» ведёт на раздел выше: родительскую категорию или весь каталог
  const parent = category ? breadcrumbs.at(-2) : undefined;

  return (
    <>
      <CatalogHeader
        // Кнопка «назад» — у заголовка, поэтому у крошек её нет: на мобильных видна полная цепочка
        breadcrumbs={<Breadcrumbs items={breadcrumbs} back={false} />}
        title={category?.name ?? config.title}
        back={parent && { label: parent.name, href: parent.href }}
        chips={chips}
        sort={
          config.sort.length > 1 ? (
            <SortMenu
              label={config.sortLabel}
              items={sortMenuItems(config.sort, sort, (value) => catalogHref(path, { sort: value, filters: filterParams }))}
            />
          ) : null
        }
        filter={
          config.filter && (groups.length || filtered) ? (
            <CatalogFilter
              label={config.filter.label}
              applyLabel={config.filter.applyLabel}
              resetLabel={config.filter.resetLabel}
              groups={groups}
              applied={applied}
              baseHref={catalogHref(path, { sort: sortParam })}
            />
          ) : null
        }
      />
      <Container className="pt-20.75 pb-21 md:px-10.5">
        {result.count > 0 ? (
          <div className="flex flex-col gap-16">
            <ProductGrid
              items={result.items.map(toCardProps)}
              columns={config.columns}
              imageClassName="aspect-161/220 md:aspect-314/381"
              className="gap-x-5 gap-y-16 md:gap-y-15.5"
              favorite={(item) => <WishlistToggle productId={item.id} title={item.title} />}
            />
            <PagePagination
              page={page}
              totalPages={totalPages}
              href={(next) => catalogHref(path, { page: next, sort: sortParam, filters: filterParams })}
              label="Страницы каталога"
            />
          </div>
        ) : (
          <p className="text-300 text-muted-foreground">{filtered && config.filter ? config.filter.emptyText : config.emptyText}</p>
        )}
      </Container>
    </>
  );
}
