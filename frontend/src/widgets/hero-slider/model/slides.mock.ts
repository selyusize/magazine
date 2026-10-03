import { routes } from "@shared/config";

import type { HeroSlide } from "./types";

/** Мок до появления баннеров в CMS / Medusa. */
export const heroSlidesMock: HeroSlide[] = [
  {
    id: "new-season",
    title: "Подчеркните свой стиль. Вечная мода, осознанный выбор",
    image: { src: "/images/hero.png", alt: "Модель в бежевом свитере крупной вязки с кожаной сумкой" },
    cta: { label: "Смотреть каталог", href: routes.catalog },
  },
  {
    id: "knitwear",
    title: "Трикотаж, который хочется носить годами",
    image: { src: "/images/hero.png", alt: "Свитер крупной вязки из новой коллекции" },
    cta: { label: "Новинки", href: "/new" },
  },
  {
    id: "sale",
    title: "Распродажа сезона: до −40% на избранные модели",
    image: { src: "/images/hero.png", alt: "Образы из распродажи сезона" },
    cta: { label: "К распродаже", href: "/sale" },
  },
];
