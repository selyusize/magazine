import Image from "next/image";
import Link from "next/link";

import { cn } from "@shared/lib/utils";

import type { CollectionBanner as CollectionBannerData } from "../model/types";

export type CollectionBannerProps = CollectionBannerData & {
  /** Подсказка браузеру о ширине картинки (next/image sizes) — зависит от числа колонок */
  sizes: string;
  className?: string;
};

/** Карточка-ссылка на подборку: фото, затемнение снизу, подпись слева внизу. */
export function CollectionBanner({ title, href, image, tone = "light", sizes, className }: CollectionBannerProps) {
  return (
    <Link
      href={href}
      data-slot="collection-banner"
      data-tone={tone}
      className={cn(
        "group/banner relative isolate flex items-end overflow-hidden p-8",
        tone === "light" ? "text-white" : "text-black",
        className,
      )}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        className="-z-10 object-cover transition-transform duration-700 group-hover/banner:scale-105"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-transparent from-45% to-black/10 to-85%" />
      <h3 className="text-600 group-hover/banner:underline">{title}</h3>
    </Link>
  );
}
