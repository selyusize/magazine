import { useEffect, useState } from "react";

import { useExchangeReview } from "./exchange-api";

export const REVIEW_PAGE_SIZE = 50;

/** Очередь «требует разбора» поставщика с пагинацией. */
export function useExchangeReviewTab(supplierId: string) {
  const [pageIndex, setPageIndex] = useState(0);
  useEffect(() => setPageIndex(0), [supplierId]);

  const review = useExchangeReview({
    supplier_id: supplierId,
    limit: REVIEW_PAGE_SIZE,
    offset: pageIndex * REVIEW_PAGE_SIZE,
  });
  const count = review.data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / REVIEW_PAGE_SIZE));

  return {
    products: review.data?.products ?? [],
    count,
    unmappedGroups: review.data?.unmapped_groups ?? 0,
    isLoading: review.isLoading,
    error: review.error,
    pageIndex,
    pageCount,
    canPreviousPage: pageIndex > 0,
    canNextPage: pageIndex + 1 < pageCount,
    previousPage: () => setPageIndex((index) => Math.max(0, index - 1)),
    nextPage: () => setPageIndex((index) => Math.min(pageCount - 1, index + 1)),
  };
}
