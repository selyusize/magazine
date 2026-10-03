import { toast, usePrompt } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useDeleteRedirect,
  useImportRedirects,
  useRedirects,
  type AdminRedirect,
} from "./redirects-api";

export const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

/** Состояние страницы редиректов: поиск, пагинация, удаление, импорт. Компоненты только рисуют. */
export function useRedirectsPage() {
  const { t } = useTranslation();
  const prompt = usePrompt();

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [editing, setEditing] = useState<AdminRedirect | "new" | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPageIndex(0);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const list = useRedirects({
    q,
    limit: PAGE_SIZE,
    offset: pageIndex * PAGE_SIZE,
  });
  const deleteRedirect = useDeleteRedirect();
  const importRedirects = useImportRedirects();

  const count = list.data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const remove = async (redirect: AdminRedirect) => {
    const confirmed = await prompt({
      title: t("redirects.delete.title"),
      description: t("redirects.delete.description", {
        path: redirect.from_path,
      }),
      confirmText: t("redirects.delete.confirm"),
      cancelText: t("redirects.cancel"),
    });
    if (!confirmed) return;

    deleteRedirect.mutate(redirect.id, {
      onSuccess: () => toast.success(t("redirects.delete.done")),
      onError: (error) => toast.error(error.message),
    });
  };

  const importFile = async (file: File) => {
    const csv = await file.text();
    importRedirects.mutate(csv, {
      onSuccess: ({ count }) =>
        toast.success(t("redirects.import.done", { count })),
      onError: (error) => toast.error(error.message),
    });
  };

  return {
    redirects: list.data?.redirects ?? [],
    count,
    isLoading: list.isLoading,
    isFetching: list.isFetching,
    error: list.error,
    search,
    setSearch,
    pageIndex,
    pageCount,
    canPreviousPage: pageIndex > 0,
    canNextPage: pageIndex + 1 < pageCount,
    previousPage: () => setPageIndex((index) => Math.max(0, index - 1)),
    nextPage: () => setPageIndex((index) => Math.min(pageCount - 1, index + 1)),
    editing,
    openNew: () => setEditing("new"),
    openEdit: (redirect: AdminRedirect) => setEditing(redirect),
    closeEditor: () => setEditing(null),
    remove,
    importFile,
    isImporting: importRedirects.isPending,
  };
}
