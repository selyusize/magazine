"use client";

import { useEffect, useState, type MouseEvent } from "react";

export type UseSearchPanelOptions = {
  /** Под каким элементом открывается панель (CSS-селектор). По умолчанию — под хедером AppShell */
  anchor?: string;
};

const DEFAULT_ANCHOR = '[data-slot="app-header"]';

/** Нижний край якоря во вьюпорте. Хедер уехал вверх при прокрутке — панель от верха окна. */
function measureTop(anchor: string) {
  const bottom = document.querySelector(anchor)?.getBoundingClientRect().bottom ?? 0;
  return Math.max(0, Math.round(bottom));
}

/** Открытие панели поиска и её положение под хедером. Сам поиск — в useSearchResults. */
export function useSearchPanel({ anchor = DEFAULT_ANCHOR }: UseSearchPanelOptions = {}) {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(0);

  useEffect(() => {
    if (!open) return;
    const update = () => setTop(measureTop(anchor));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, anchor]);

  /**
   * Триггер — обычная ссылка на страницу поиска (работает без JS). С JS простой клик открывает панель,
   * клик с модификатором (новая вкладка) — как у ссылки.
   */
  function onTriggerClick(event: MouseEvent) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setOpen(true);
  }

  /** Переход по любой ссылке внутри панели (товар, «Смотреть все») закрывает её */
  function onContentClick(event: MouseEvent) {
    if ((event.target as Element).closest("a[href]")) setOpen(false);
  }

  return { open, onOpenChange: setOpen, onTriggerClick, onContentClick, top, close: () => setOpen(false) };
}
