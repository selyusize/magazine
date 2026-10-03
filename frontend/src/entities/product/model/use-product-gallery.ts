"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { CarouselApi } from "@shared/ui/carousel";

import { GALLERY_STACK_QUERY } from "../config/gallery";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function useMediaQuery(query: string | undefined) {
  return useSyncExternalStore(
    (onChange) => {
      if (!query) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => (query ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/**
 * Состояние галереи: текущее фото и переход к фото по точкам.
 * Слайдер — текущее фото из карусели. Столбик (stack на десктопе) — фото, которое больше всего видно на экране;
 * точка прокручивает страницу к своему фото.
 */
export function useProductGallery({ layout }: { layout: "stack" | "slider" }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const slides = useRef<(HTMLElement | null)[]>([]);
  const stacked = useMediaQuery(layout === "stack" ? GALLERY_STACK_QUERY : undefined);
  const reducedMotion = useMediaQuery(reducedMotionQuery);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    api.on("select", onSelect).on("reInit", onSelect);
    return () => {
      api.off("select", onSelect).off("reInit", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!stacked) return;
    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target, entry.intersectionRatio);
        const visible = slides.current.map((slide) => (slide ? (ratios.get(slide) ?? 0) : 0));
        const best = visible.indexOf(Math.max(...visible));
        if (best >= 0 && (visible[best] ?? 0) > 0) setSelected(best);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const slide of slides.current) if (slide) observer.observe(slide);
    return () => observer.disconnect();
  }, [stacked]);

  return {
    setApi,
    selected,
    onSelect: (index: number) => {
      if (stacked) slides.current[index]?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      else api?.scrollTo(index);
    },
    /** ref слайда: по нему столбик определяет видимое фото */
    slideRef: (index: number) => (element: HTMLElement | null) => {
      slides.current[index] = element;
    },
  };
}
