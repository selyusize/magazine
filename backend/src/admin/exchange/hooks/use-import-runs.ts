import { toast } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { type ExchangeSupplier, useImportRun, useImportRuns, usePullSupplier, useRetryImportRun } from "./exchange-api";

export const RUNS_PAGE_SIZE = 20;

/** История импортов поставщика: пагинация, карточка запуска, ручной запуск pull и повтор упавшего. */
export function useImportRunsTab(supplier: ExchangeSupplier) {
  const { t } = useTranslation();
  const [pageIndex, setPageIndex] = useState(0);
  const [openedId, setOpenedId] = useState<string | null>(null);

  useEffect(() => {
    setPageIndex(0);
    setOpenedId(null);
  }, [supplier.id]);

  const list = useImportRuns({ supplier_id: supplier.id, limit: RUNS_PAGE_SIZE, offset: pageIndex * RUNS_PAGE_SIZE });
  const opened = useImportRun(openedId);
  const pull = usePullSupplier();
  const retry = useRetryImportRun();

  const count = list.data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / RUNS_PAGE_SIZE));
  const notify = { onError: (error: Error) => toast.error(error.message) };

  return {
    runs: list.data?.import_runs ?? [],
    count,
    isLoading: list.isLoading,
    error: list.error,
    pageIndex,
    pageCount,
    canPreviousPage: pageIndex > 0,
    canNextPage: pageIndex + 1 < pageCount,
    previousPage: () => setPageIndex((index) => Math.max(0, index - 1)),
    nextPage: () => setPageIndex((index) => Math.min(pageCount - 1, index + 1)),
    canPull: supplier.exchange?.mode === "pull",
    pull: () =>
      pull.mutate(supplier.id, {
        ...notify,
        onSuccess: ({ import_run }) =>
          import_run.status === "failed"
            ? toast.error(import_run.message ?? t("exchange.runs.failed"))
            : toast.success(t("exchange.runs.started")),
      }),
    isPulling: pull.isPending,
    retry: (id: string) => retry.mutate(id, { ...notify, onSuccess: () => toast.success(t("exchange.runs.started")) }),
    opened: opened.data ?? null,
    open: setOpenedId,
    close: () => setOpenedId(null),
  };
}
