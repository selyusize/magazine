import Image from "next/image";
import Link from "next/link";

import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";

import type { HeroSlide as HeroSlideData } from "../model/types";

export type HeroSlideProps = HeroSlideData & {
  /** Первый видимый слайд — LCP: грузится сразу и с высоким приоритетом */
  priority?: boolean;
};

/** Баннер во всю ширину: фото, лёгкое затемнение, заголовок и кнопка внизу слева. */
export function HeroSlide({ title, image, cta, tone = "light", priority }: HeroSlideProps) {
  return (
    <div
      data-slot="hero-slide"
      data-tone={tone}
      className={cn(
        "relative isolate flex h-149.5 flex-col items-start justify-end gap-5 px-8 py-16 md:h-178 md:p-16",
        tone === "light" ? "text-white" : "text-black",
      )}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="100vw"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        className="-z-10 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/10" />
      <h2 className="max-w-96 text-900">{title}</h2>
      {cta ? (
        <Button asChild variant="secondary" size="xl">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
