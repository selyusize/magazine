import { routes } from "@shared/config";

import type { CollectionBanner } from "./types";

/** Мок до появления подборок в CMS / коллекций Medusa. */
export const collectionBannersMock = {
  title: "Гардероб, продуманный до мелочей. Вещи, созданные бережно и на долгие годы.",
  items: [
    {
      id: "new-arrivals",
      title: "Новинки",
      href: "/new",
      image: { src: "/images/collections/new-arrivals.png", alt: "Модель в чёрном свитере крупной вязки с холщовой сумкой" },
    },
    {
      id: "casual",
      title: "Повседневный стиль",
      href: routes.collection("casual"),
      image: { src: "/images/collections/casual-edit.jpg", alt: "Бежевая мини-юбка и белый свитер" },
    },
    {
      id: "best-sellers",
      title: "Хиты продаж",
      href: routes.collection("best-sellers"),
      image: { src: "/images/collections/best-sellers.jpg", alt: "Оранжевый свитер и коричневая кожаная сумка" },
    },
  ] satisfies CollectionBanner[],
};

/** Две большие карточки-образа (вторая секция баннеров макета). Заголовок секции скрыт визуально. */
export const lookbookBannersMock = {
  title: "Образы сезона",
  items: [
    {
      id: "smart-chic",
      title: "Деловой шик",
      href: routes.collection("smart-chic"),
      image: { src: "/images/collections/smart-chic.png", alt: "Модель в чёрном платье-рубашке с широким поясом" },
    },
    {
      id: "ready-to-go",
      title: "Готовые образы",
      href: routes.collection("ready-to-go"),
      image: { src: "/images/collections/ready-to-go.png", alt: "Модель в тёмном джемпере и юбке в клетку" },
    },
  ] satisfies CollectionBanner[],
};
