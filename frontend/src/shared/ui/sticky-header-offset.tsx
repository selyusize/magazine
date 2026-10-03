"use client";

import { useEffect, useRef } from "react";

/** CSS-переменная с высотой липкого хедера: `top-(--sticky-header-height)` у липких колонок и панелей */
export const STICKY_HEADER_VAR = "--sticky-header-height";

/**
 * Следит за высотой липкого хедера (промо-полоса, перенос строк, мобильный/десктоп) и пишет её в
 * --sticky-header-height на <html>. Кладётся внутрь <header>.
 * Хедер не липкий — переменной нет, липкие элементы берут запасное значение `var(--sticky-header-height, 0px)`.
 */
export function StickyHeaderOffset() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const header = ref.current?.parentElement;
    if (!header) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty(STICKY_HEADER_VAR, `${header.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => {
      observer.disconnect();
      root.style.removeProperty(STICKY_HEADER_VAR);
    };
  }, []);

  return <span ref={ref} hidden />;
}
