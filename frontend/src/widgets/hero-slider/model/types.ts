import type { NavLink } from "@shared/config";

export type HeroSlide = {
  id: string;
  title: string;
  image: {
    src: string;
    /** Описание картинки для поисковиков и скринридеров */
    alt: string;
  };
  /** Кнопка под заголовком */
  cta?: NavLink;
  /** Цвет текста и индикаторов поверх картинки: light — белый (тёмное фото), dark — чёрный */
  tone?: "light" | "dark";
};
