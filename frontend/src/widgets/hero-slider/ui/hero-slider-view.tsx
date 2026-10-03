import type { FocusEventHandler } from "react";

import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@shared/ui/carousel";
import { Icon } from "@shared/ui/icon";

import type { HeroSlide as HeroSlideData } from "../model/types";
import { HeroSlide } from "./hero-slide";

export type HeroSliderViewProps = {
  slides: HeroSlideData[];
  selected: number;
  label?: string;
  /** Автопрокрутка включена — показываем кнопку паузы */
  autoplay?: { playing: boolean; onToggle: () => void };
  setApi: (api: CarouselApi) => void;
  onSelect: (index: number) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onFocus?: () => void;
  onBlur?: FocusEventHandler<HTMLElement>;
};

/**
 * Карусель баннеров. Все слайды в HTML с сервера (видны поисковикам), листаются свайпом,
 * стрелками клавиатуры и индикаторами. Один слайд — без индикаторов и прокрутки.
 */
export function HeroSliderView({
  slides,
  selected,
  label = "Акции и коллекции",
  autoplay,
  setApi,
  onSelect,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
}: HeroSliderViewProps) {
  const multiple = slides.length > 1;
  const tone = slides[selected]?.tone ?? "light";
  const controlClassName = "opacity-40 transition-opacity group-hover/control:opacity-100";

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: multiple, active: multiple }}
      aria-label={label}
      data-slot="hero-slider"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {/* Во время автопрокрутки смена слайда не озвучивается, при ручной — озвучивается */}
      <CarouselContent className="ml-0" aria-live={autoplay?.playing ? "off" : "polite"}>
        {slides.map((slide, index) => (
          <CarouselItem
            key={slide.id}
            className="pl-0"
            aria-label={`${index + 1} из ${slides.length}`}
            // Скрытые слайды вне фокуса и дерева доступности, но остаются в HTML
            inert={multiple && index !== selected}
          >
            <HeroSlide {...slide} priority={index === 0} />
          </CarouselItem>
        ))}
      </CarouselContent>
      {multiple ? (
        <div
          data-slot="hero-slider-controls"
          className={cn(
            "absolute right-8 bottom-16 flex items-center gap-2 md:right-16",
            tone === "light" ? "text-white" : "text-black",
          )}
        >
          {autoplay ? (
            <Button
              variant="bare"
              size="icon"
              aria-label={autoplay.playing ? "Остановить автопрокрутку" : "Включить автопрокрутку"}
              onClick={autoplay.onToggle}
              className="group/control mr-2"
            >
              <Icon name={autoplay.playing ? "pause" : "play"} className={cn("size-4", controlClassName)} />
            </Button>
          ) : null}
          {slides.map((slide, index) => (
            <Button
              key={slide.id}
              variant="bare"
              size="bare"
              aria-label={`Слайд ${index + 1} из ${slides.length}`}
              aria-current={index === selected}
              onClick={() => onSelect(index)}
              className="group/control relative py-5 after:absolute after:-inset-x-1 after:inset-y-0"
            >
              <span
                className={cn("block h-0.5 w-6 bg-current group-aria-current/control:opacity-100", controlClassName)}
              />
            </Button>
          ))}
        </div>
      ) : null}
    </Carousel>
  );
}
