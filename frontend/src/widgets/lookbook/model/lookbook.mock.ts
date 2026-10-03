import type { LookbookImage } from "./types";

/**
 * ВРЕМЕННО: лукбук макета (Figma: Product detail — Elegant Ease), пока у товаров в Medusa не заполнена
 * metadata.lookbook. Фото макета в бесплатной копии нет — фото из подборок
 */
export const lookbookMock: { title: string; subtitle: string; images: LookbookImage[] } = {
  title: "Элегантная простота",
  subtitle: "Вдохновение для базового гардероба",
  images: [
    { src: "/images/collections/new-arrivals.png", alt: "Модель в чёрном свитере крупной вязки с холщовой сумкой" },
    { src: "/images/products/cropped-cardigan.png", alt: "Бежевый кардиган крупной вязки" },
  ],
};
