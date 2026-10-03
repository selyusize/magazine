import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@widgets/breadcrumbs";
import { SearchField, SearchResults, SearchResultsMessage, formatCount, formatEmpty, searchParamsSchema } from "@features/product-search";
import { listProducts, toCardProps } from "@entities/product";
import { routes, siteConfig } from "@shared/config";
import { Container } from "@shared/ui/container";
import { PagePagination } from "@shared/ui/page-pagination";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Адрес страницы результатов: первая — без ?page, чтобы у одной выдачи был один URL */
const pageHref = (q: string, page: number) => (page > 1 ? `${routes.search(q)}&page=${page}` : routes.search(q));

/**
 * Внутренний поиск не индексируется (noindex): поисковики считают такие страницы малополезными дублями каталога.
 * follow — ссылки на товары из выдачи при этом учитываются.
 */
export async function generateSearchMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = searchParamsSchema.parse(await searchParams);
  const label = siteConfig.search?.label ?? "Поиск";

  return {
    title: q ? `${label}: ${q}` : label,
    robots: { index: false, follow: true },
  };
}

/** Страница результатов поиска (Figma: Search results, во всю страницу). Рендерится на сервере. */
export async function SearchPage({ searchParams }: SearchPageProps) {
  const config = siteConfig.search;
  if (!config) notFound();

  const { q, page } = searchParamsSchema.parse(await searchParams);
  const result = q ? await listProducts({ q, limit: config.pageSize, offset: (page - 1) * config.pageSize }) : null;
  const totalPages = result ? Math.ceil(result.count / config.pageSize) : 0;

  // Страница за пределами выдачи (?page=999) — 404, а не пустая страница с кодом 200
  if (result && page > 1 && page > totalPages) notFound();

  return (
    <Container className="pb-12">
      <div className="md:px-4.5">
        {/* Поиск не индексируется — разметка крошек не нужна */}
        <Breadcrumbs items={[{ name: config.label, href: routes.search() }]} jsonLd={false} className="pt-5" />
        <h1 className="sr-only">{q ? `${config.label}: ${q}` : config.label}</h1>
        <SearchField
          action={routes.search()}
          label={config.label}
          placeholder={config.placeholder}
          defaultValue={q}
          // Новый запрос — новое поле: иначе после перехода в нём остался бы прошлый текст
          key={q}
          autoFocus={!q}
          className="py-6.75"
        />
        {result && result.count > 0 ? (
          <SearchResults
            className="pt-6 md:pt-13"
            items={result.items.map(toCardProps)}
            summary={formatCount(result.count, config.countForms)}
            summaryAs="h2"
            footer={<PagePagination page={page} totalPages={totalPages} href={(next) => pageHref(q, next)} label="Страницы результатов" />}
          />
        ) : null}
        {result && result.count === 0 ? (
          <div className="pt-6 md:pt-13">
            <SearchResultsMessage>{formatEmpty(config.emptyText, q)}</SearchResultsMessage>
          </div>
        ) : null}
      </div>
    </Container>
  );
}
