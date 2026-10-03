export type CollectionBanner = {
  id: string;
  title: string;
  /** Куда ведёт карточка: коллекция, категория, подборка */
  href: string;
  image: {
    src: string;
    /** Описание картинки для поисковиков и скринридеров */
    alt: string;
  };
  /** Цвет подписи поверх картинки: light — белый (тёмное фото), dark — чёрный */
  tone?: "light" | "dark";
};
