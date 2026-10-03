"use client";

import { useState } from "react";

import { toCardProps, type ProductCardItem } from "@entities/product";
import type { SearchConfig } from "@shared/config";
import { getErrorMessage } from "@shared/lib/errors";
import { useDebouncedValue } from "@shared/lib/use-debounced-value";

import { useProductSearch } from "./search.queries";
import { formatCount, formatEmpty } from "./summary";

export type UseSearchResultsOptions = Pick<
  SearchConfig,
  "previewLimit" | "minLength" | "debounceMs" | "countForms" | "emptyText"
>;

export type SearchResultsState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "empty"; message: string }
  | { status: "results"; items: ProductCardItem[]; summary: string; query: string };

/**
 * Поиск на лету: текст поля, запрос с паузой после ввода, состояние для представления.
 * Пока идёт запрос, на экране остаются прошлые результаты (при первом вводе — ничего), а `pending` включает
 * индикатор у поля: сетка меняется один раз, когда ответ готов, без мигания заглушек.
 */
export function useSearchResults({ previewLimit, minLength, debounceMs, countForms, emptyText }: UseSearchResultsOptions) {
  const [query, setQuery] = useState("");
  const term = useDebouncedValue(query.trim(), debounceMs);
  const enabled = term.length >= minLength;
  const search = useProductSearch(term, previewLimit, enabled);

  let state: SearchResultsState = { status: "idle" };
  if (enabled && search.isError) state = { status: "error", message: getErrorMessage(search.error) };
  else if (enabled && search.data?.count === 0) state = { status: "empty", message: formatEmpty(emptyText, term) };
  else if (enabled && search.data)
    state = {
      status: "results",
      items: search.data.items.map(toCardProps),
      summary: formatCount(search.data.count, countForms),
      query: term,
    };

  // Ввод ещё не «устоялся» или запрос в пути — показываем индикатор
  const pending = query.trim().length >= minLength && (query.trim() !== term || search.isFetching);

  return { query, onQueryChange: setQuery, state, pending };
}
