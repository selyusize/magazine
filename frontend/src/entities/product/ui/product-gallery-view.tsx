import Image from "next/image";

import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@shared/ui/carousel";

import { GALLERY_STACK_QUERY } from "../config/gallery";
import type { ProductImage } from "../model/types";

export type ProductGalleryViewProps = {
  images: ProductImage[];
  /** Десктоп: stack — столбиком с точками слева, slider — по одному. На мобильных всегда слайдер */
  layout: "stack" | "slider";
  /** Пропорции фото: `1 / 1`, `4 / 5` */
  aspectRatio: string;
  /** Подпись галереи для скринридеров */
  label: string;
  /** Подсказка браузеру о ширине фото (next/image sizes) — зависит от раскладки страницы */
  sizes?: string;
  selected: number;
  setApi: (api: CarouselApi) => void;
  onSelect: (index: number) => void;
  slideRef: (index: number) => (element: HTMLElement | null) => void;
  className?: string;
};

/**
 * Галерея товара (Figma: Product detail). Все фото — в HTML с сервера, с alt: их индексирует поиск по картинкам.
 * Первое фото грузится сразу (LCP), остальные — лениво. Листается свайпом, стрелками клавиатуры и точками.
 */
export function ProductGalleryView({
  images,
  layout,
  aspectRatio,
  label,
  sizes = `${GALLERY_STACK_QUERY} 50vw, 100vw`,
  selected,
  setApi,
  onSelect,
  slideRef,
  className,
}: ProductGalleryViewProps) {
  const multiple = images.length > 1;
  const stack = layout === "stack";

  if (!images.length) {
    return <div data-slot="product-gallery" className={cn("bg-accent", className)} style={{ aspectRatio }} />;
  }

  return (
    <Carousel
      setApi={setApi}
      // В столбике на десктопе карусель выключена: фото просто идут друг под другом
      opts={{ active: multiple, breakpoints: stack ? { [GALLERY_STACK_QUERY]: { active: false } } : undefined }}
      aria-label={label}
      data-slot="product-gallery"
      data-layout={layout}
      className={cn(
        "flex flex-col gap-4",
        // Обёртка ленты (carousel-content) занимает всё место рядом с точками
        stack && "lg:flex-row lg:gap-5 lg:*:data-[slot=carousel-content]:min-w-0 lg:*:data-[slot=carousel-content]:flex-1",
        className,
      )}
    >
      <CarouselContent className={cn("ml-0", stack && "lg:flex-col lg:gap-2.5")}>
        {images.map((image, index) => (
          <CarouselItem
            key={image.src}
            ref={slideRef(index)}
            aria-label={`${index + 1} из ${images.length}`}
            className="pl-0"
          >
            <div className="relative overflow-hidden bg-accent" style={{ aspectRatio }}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={sizes}
                // Первое фото — главный элемент страницы (LCP): грузится сразу и с высоким приоритетом
                {...(index === 0 ? { preload: true, fetchPriority: "high" as const } : { loading: "lazy" as const })}
                className="object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {multiple ? (
        <div
          className={cn(
            "flex justify-center gap-2",
            // Столбик: точки слева от фото, прилипают к середине экрана
            stack && "lg:sticky lg:top-1/2 lg:order-first lg:flex-col lg:self-start lg:justify-start",
          )}
        >
          {images.map((image, index) => (
            <Button
              key={image.src}
              type="button"
              variant="bare"
              size="bare"
              aria-label={`Фото ${index + 1} из ${images.length}`}
              aria-current={index === selected ? "true" : undefined}
              onClick={() => onSelect(index)}
              className="relative size-2 rounded-full border border-foreground after:absolute after:-inset-1.5 aria-current:bg-foreground"
            />
          ))}
        </div>
      ) : null}
    </Carousel>
  );
}
