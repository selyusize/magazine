import Image from "next/image";

import { Icon } from "@shared/ui/icon";

import type { SocialNetwork, SocialPost as SocialPostData } from "../model/types";

export type SocialPostProps = SocialPostData & {
  network: SocialNetwork;
  /** Подсказка браузеру о ширине картинки (next/image sizes) */
  sizes: string;
};

/** Квадратное фото-ссылка на публикацию; при наведении — затемнение и иконка соцсети. */
export function SocialPost({ href, image, network, sizes }: SocialPostProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-slot="social-post"
      className="group/post relative block aspect-square overflow-hidden"
    >
      <Image src={image.src} alt={image.alt} fill sizes={sizes} className="object-cover" />
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center bg-black/50 text-white opacity-0 transition-opacity group-hover/post:opacity-100 group-focus-visible/post:opacity-100"
      >
        <Icon name={network.icon} className="size-8.5" />
      </span>
      <span className="sr-only">{`Открыть в ${network.label} (новая вкладка)`}</span>
    </a>
  );
}
