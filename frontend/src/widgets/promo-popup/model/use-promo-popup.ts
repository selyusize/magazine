"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { PromoPopupConfig } from "@shared/config";

import { canShowPromo, markPromoShown, markPromoSubscribed } from "./storage";

export type UsePromoPopupOptions = Pick<PromoPopupConfig, "id" | "trigger" | "dismissDays" | "excludePaths">;

export const isExcludedPath = (pathname: string, excludePaths: string[] = []) =>
  excludePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/**
 * Когда показать попап: первый сработавший триггер (задержка, прокрутка, уход курсора к краю окна).
 * Показ запоминается сразу — перезагрузка страницы не вызовет попап повторно раньше dismissDays.
 */
export function usePromoPopup({ id, trigger, dismissDays, excludePaths }: UsePromoPopupOptions) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const excluded = isExcludedPath(pathname, excludePaths);
  const { delay, scrollDepth, exitIntent } = trigger;

  useEffect(() => {
    if (excluded || !canShowPromo(id, dismissDays)) return;

    const controller = new AbortController();
    const { signal } = controller;
    let timer: number | undefined;
    const stop = () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    const show = () => {
      stop();
      markPromoShown(id);
      setOpen(true);
    };

    if (delay !== undefined) timer = window.setTimeout(show, delay);

    if (scrollDepth !== undefined) {
      const onScroll = () => {
        const { scrollHeight } = document.documentElement;
        if (window.scrollY + window.innerHeight >= scrollHeight * scrollDepth) show();
      };
      window.addEventListener("scroll", onScroll, { passive: true, signal });
    }

    // Только для мыши: на тач-устройствах «ухода курсора» не бывает
    if (exitIntent && window.matchMedia("(hover: hover)").matches) {
      const onMouseOut = (event: MouseEvent) => {
        if (!event.relatedTarget && event.clientY <= 0) show();
      };
      document.addEventListener("mouseout", onMouseOut, { signal });
    }

    return stop;
  }, [id, dismissDays, excluded, delay, scrollDepth, exitIntent]);

  return {
    open,
    onOpenChange: setOpen,
    onSubscribed: () => markPromoSubscribed(id),
  };
}
