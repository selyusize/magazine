export type PageItem = number | "ellipsis";

/**
 * Номера страниц для пагинации: первая, последняя, текущая с соседями, между ними — многоточие.
 * paginationRange(6, 12) → [1, "ellipsis", 5, 6, 7, "ellipsis", 12]
 */
export function paginationRange(current: number, total: number, siblings = 1): PageItem[] {
  if (total <= 1) return total === 1 ? [1] : [];

  const pages = new Set([1, total]);
  for (let page = current - siblings; page <= current + siblings; page++) {
    if (page >= 1 && page <= total) pages.add(page);
  }

  return [...pages]
    .sort((a, b) => a - b)
    .flatMap<PageItem>((page, index, sorted) => {
      const gap = page - (sorted[index - 1] ?? page - 1);
      // Пропуск в одну страницу показываем номером, а не многоточием
      if (gap === 2) return [page - 1, page];
      return gap > 2 ? ["ellipsis", page] : [page];
    });
}
