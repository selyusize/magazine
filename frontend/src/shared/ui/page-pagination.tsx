import { paginationRange } from "@shared/lib/pagination";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@shared/ui/pagination";

export type PagePaginationProps = {
  page: number;
  totalPages: number;
  /** Адрес страницы по номеру */
  href: (page: number) => string;
  /** Подпись навигации для скринридеров */
  label?: string;
};

/** Пагинация обычными ссылками: работает без JS, поисковик проходит по всем страницам. Каталог, поиск. */
export function PagePagination({ page, totalPages, href, label = "Страницы" }: PagePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <Pagination aria-label={label} className="pt-4">
      <PaginationContent>
        {page > 1 ? (
          <PaginationItem>
            <PaginationPrevious href={href(page - 1)} text="Назад" aria-label="Предыдущая страница" />
          </PaginationItem>
        ) : null}
        {paginationRange(page, totalPages).map((item, index) => (
          <PaginationItem key={item === "ellipsis" ? `ellipsis-${index}` : item}>
            {item === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href={href(item)} isActive={item === page} aria-label={`Страница ${item}`}>
                {item}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        {page < totalPages ? (
          <PaginationItem>
            <PaginationNext href={href(page + 1)} text="Вперёд" aria-label="Следующая страница" />
          </PaginationItem>
        ) : null}
      </PaginationContent>
    </Pagination>
  );
}
