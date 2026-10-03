"use client";

import { HeroSliderView } from "../ui/hero-slider-view";
import { heroSlidesMock } from "./slides.mock";
import type { HeroSlide } from "./types";
import { useHeroSlider } from "./use-hero-slider";

export type HeroSliderProps = {
  slides?: HeroSlide[];
  /** Интервал автопрокрутки, мс. Не задан — без автопрокрутки */
  autoplay?: number;
  /** Подпись карусели для скринридеров */
  label?: string;
};

// Связка: состояние карусели из model + «тупое» представление из ui.
export function HeroSlider({ slides = heroSlidesMock, autoplay, label }: HeroSliderProps) {
  return <HeroSliderView slides={slides} label={label} {...useHeroSlider({ autoplay, count: slides.length })} />;
}
