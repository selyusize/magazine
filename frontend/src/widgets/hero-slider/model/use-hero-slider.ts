import { useEffect, useState, useSyncExternalStore, type FocusEvent } from "react";

import type { CarouselApi } from "@shared/ui/carousel";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getReducedMotion = () => window.matchMedia(reducedMotionQuery).matches;

/**
 * Состояние слайдера: текущий слайд, переход к слайду, автопрокрутка.
 * Автопрокрутка встаёт на паузу при наведении / фокусе внутри, на время свайпа, по кнопке паузы
 * и выключена при prefers-reduced-motion. После ручного перехода отсчёт начинается заново.
 */
export function useHeroSlider({ autoplay, count }: { autoplay?: number; count: number }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  // Пауза от наведения / фокуса — временная; от кнопки — пока пользователь не включит снова
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);

  const canAutoplay = Boolean(autoplay) && count > 1 && !reducedMotion;
  const playing = canAutoplay && !stopped;

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    api.on("select", onSelect).on("reInit", onSelect);
    return () => {
      api.off("select", onSelect).off("reInit", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || !autoplay || !playing || hovered || focused) return;
    let timer: number | undefined;
    const stop = () => window.clearTimeout(timer);
    const schedule = () => {
      stop();
      timer = window.setTimeout(() => api.scrollNext(), autoplay);
    };
    schedule();
    // Любой переход (свайп, индикатор, клавиатура) перезапускает отсчёт; во время свайпа — стоп
    api.on("select", schedule).on("pointerDown", stop).on("pointerUp", schedule);
    return () => {
      stop();
      api.off("select", schedule).off("pointerDown", stop).off("pointerUp", schedule);
    };
  }, [api, autoplay, playing, hovered, focused]);

  return {
    setApi,
    selected,
    /** Кнопка паузы нужна только когда автопрокрутка вообще возможна (WCAG 2.2.2) */
    autoplay: canAutoplay ? { playing, onToggle: () => setStopped((value) => !value) } : undefined,
    onSelect: (index: number) => api?.scrollTo(index),
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    // Переход фокуса между элементами внутри слайдера — не уход из него
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
    },
  };
}
