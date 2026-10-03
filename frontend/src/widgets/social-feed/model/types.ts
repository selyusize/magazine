import type { IconName } from "@shared/config";

export type SocialPost = {
  id: string;
  /** Ссылка на публикацию в соцсети */
  href: string;
  image: {
    src: string;
    /** Описание фото для поисковиков и скринридеров */
    alt: string;
  };
};

/** Соцсеть ленты: название для подписи ссылок и иконка из реестра (поверх фото при наведении) */
export type SocialNetwork = {
  label: string;
  icon: IconName;
};
