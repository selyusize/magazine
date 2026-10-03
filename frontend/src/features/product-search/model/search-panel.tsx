"use client";

import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { routes, type SearchConfig } from "@shared/config";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { DialogClose } from "@shared/ui/dialog";
import { Icon } from "@shared/ui/icon";
import { Spinner } from "@shared/ui/spinner";

import { SearchField } from "../ui/search-field";
import { SearchPanelSections, SearchPanelView } from "../ui/search-panel-view";
import { SearchResults, SearchResultsMessage, type SearchResultsColumns } from "../ui/search-results";
import { useSearchPanel } from "./use-search-panel";
import { useSearchResults } from "./use-search-results";

export type SearchPanelProps = SearchConfig & {
  /** Страница результатов. По умолчанию routes.search() */
  action?: string;
  /** Свой триггер вместо иконки-ссылки. Должен принимать onClick и ref (Button, Link) */
  trigger?: ReactElement;
  /** Классы стандартной иконки-триггера: область нажатия, отступы под конкретный хедер */
  triggerClassName?: string;
  /** Под каким элементом открыть панель (CSS-селектор). По умолчанию — под хедером AppShell */
  anchor?: string;
  /** Колонок в сетке результатов с lg */
  columns?: SearchResultsColumns;
  /** Пока запрос короче minLength: популярные запросы, категории, недавно просмотренные */
  idle?: ReactNode;
};

/**
 * Связка: открытие из model + «тупые» диалог, поле и сетка из ui. Тексты и лимиты — из siteConfig.search.
 * Содержимое (и запросы к API) монтируется только в открытой панели.
 *
 * @example В хедере (так подключает Header при header.search.variant = "panel")
 * <SearchPanel {...siteConfig.search} triggerClassName={hitArea} />
 *
 * @example Шесть колонок и популярные категории до ввода
 * <SearchPanel {...siteConfig.search} columns={6} previewLimit={6} idle={<PopularCategories />} />
 */
export function SearchPanel({ action = routes.search(), trigger, triggerClassName, anchor, ...content }: SearchPanelProps) {
  const { close, ...panel } = useSearchPanel({ anchor });

  return (
    <SearchPanelView
      {...panel}
      title={content.label}
      trigger={
        trigger ?? (
          <Button asChild variant="bare" size="bare" className={cn("hover:opacity-60", triggerClassName)}>
            <Link href={action} aria-label={content.label} data-slot="search-panel-trigger">
              <Icon name="search" />
            </Link>
          </Button>
        )
      }
    >
      <SearchPanelContent {...content} action={action} onSubmit={close} />
    </SearchPanelView>
  );
}

type SearchPanelContentProps = Omit<SearchPanelProps, "trigger" | "triggerClassName" | "anchor"> & {
  action: string;
  onSubmit: () => void;
};

/** Поле и результаты на лету — живут, только пока панель открыта; при закрытии запрос сбрасывается */
function SearchPanelContent({
  action,
  onSubmit,
  columns = 4,
  idle,
  label,
  placeholder,
  viewAllLabel,
  ...options
}: SearchPanelContentProps) {
  const { query, onQueryChange, state, pending } = useSearchResults(options);

  return (
    <SearchPanelSections
      busy={pending}
      field={
        <SearchField
          action={action}
          label={label}
          placeholder={placeholder}
          value={query}
          onValueChange={onQueryChange}
          onSubmit={onSubmit}
          autoFocus
          trailing={
            <>
              {pending ? <Spinner aria-label="Ищем…" className="size-4.5 text-muted-foreground" /> : null}
              <DialogClose asChild>
                <Button variant="bare" size="bare" aria-label="Закрыть поиск" className="relative after:absolute after:-inset-2 hover:opacity-60">
                  <Icon name="close" className="size-4.5" />
                </Button>
              </DialogClose>
            </>
          }
        />
      }
    >
      {state.status === "idle" ? idle : null}
      {state.status === "error" || state.status === "empty" ? <SearchResultsMessage>{state.message}</SearchResultsMessage> : null}
      {state.status === "results" ? (
        <SearchResults
          items={state.items}
          summary={state.summary}
          columns={columns}
          viewAll={{ label: viewAllLabel, href: routes.search(state.query) }}
        />
      ) : null}
    </SearchPanelSections>
  );
}
