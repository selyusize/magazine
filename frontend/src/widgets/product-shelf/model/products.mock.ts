import type { ProductCardData } from "@entities/product";
import { routes } from "@shared/config";

const rub = (amount: number) => ({ amount, currencyCode: "rub" });

/** Мок до подборок из Medusa (коллекция / категория с ценами для региона). */
export const productShelfMock = {
  title: "Что носить сейчас",
  items: [
    {
      id: "zipper-tote",
      title: "Сумка-тоут на молнии",
      href: routes.product("zipper-tote"),
      price: rub(29800),
      image: { src: "/images/products/zipper-tote.png", alt: "Тёмно-оливковая кожаная сумка-тоут" },
    },
    {
      id: "phone-bag",
      title: "Сумка для телефона",
      href: routes.product("phone-bag"),
      price: rub(24800),
      image: { src: "/images/products/phone-bag.png", alt: "Чёрная кожаная сумка для телефона с ремешком" },
    },
    {
      id: "sweater-coat",
      title: "Пальто из шерсти и кашемира",
      href: routes.product("sweater-coat"),
      price: rub(39800),
      image: { src: "/images/products/sweater-coat.png", alt: "Бежевое пальто с поясом" },
    },
    {
      id: "cashmere-beanie",
      title: "Кашемировая шапка",
      href: routes.product("cashmere-beanie"),
      price: rub(9800),
      image: { src: "/images/products/cashmere-beanie.png", alt: "Шапка с помпоном цвета кэмел" },
      colors: [
        { name: "Кэмел", value: "#b8967b" },
        { name: "Чёрный", value: "#000000" },
        { name: "Розовый", value: "#f5b4b4" },
      ],
    },
    {
      id: "cropped-cardigan",
      title: "Укороченный кардиган из альпаки",
      href: routes.product("cropped-cardigan"),
      price: rub(24800),
      image: { src: "/images/products/cropped-cardigan.png", alt: "Бежевый кардиган крупной вязки" },
    },
  ] satisfies ProductCardData[],
};
