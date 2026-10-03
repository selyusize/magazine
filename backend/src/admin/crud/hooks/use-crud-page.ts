import { toast, usePrompt } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { CRUDResource, CRUDRow } from "../types";
import { useCRUDApi } from "./crud-api";

export const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

/** Состояние страницы раздела: поиск, пагинация, шторка формы, удаление. Компоненты только рисуют. */
export function useCRUDPage(resource: CRUDResource) {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const api = useCRUDApi(resource);

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [editing, setEditing] = useState<CRUDRow | "new" | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPageIndex(0);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const list = api.useList({
    q,
    limit: PAGE_SIZE,
    offset: pageIndex * PAGE_SIZE,
  });
  const remove = api.useDelete();

  const count = list.data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const confirmRemove = async (row: CRUDRow) => {
    const confirmed = await prompt({
      title: t("crud.delete.title"),
      // У раздела без страниц на витрине (поставщики) — свой текст: про 410 там неуместно
      description: t(
        [`${resource.i18n}.deleteDescription`, "crud.delete.description"],
        {
          name: String(row[resource.title] ?? row.id),
        },
      ),
      confirmText: t("crud.delete.confirm"),
      cancelText: t("crud.cancel"),
    });
    if (!confirmed) return;

    remove.mutate(row.id, {
      onSuccess: () => toast.success(t("crud.delete.done")),
      onError: (error) => toast.error(error.message),
    });
  };

  return {
    rows: list.data?.rows ?? [],
    count,
    isLoading: list.isLoading,
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
    openEdit: (row: CRUDRow) => setEditing(row),
    closeEditor: () => setEditing(null),
    remove: confirmRemove,
  };
}
