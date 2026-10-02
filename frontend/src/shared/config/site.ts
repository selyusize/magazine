import { routes } from "./routes";

/**
 * Настройки конкретного магазина. Чтобы сделать из шаблона новый магазин (очки, продукты, …),
 * обычно достаточно поменять этот файл — хедер, футер и метаданные берут данные отсюда.
 */
export type NavLink = {
  label: string;
  href: string;
  /** Вложенные пункты (выпадающее меню, мега-меню) */
  children?: NavLink[];
};

export type SiteConfig = {
  name: string;
  description: string;
  /** Язык страниц (<html lang>) */
  locale: string;
  header: {
    /** Полоса над хедером (акция, доставка). null — не показывать */
    topBar: { text: string; href?: string } | null;
    navigation: NavLink[];
    /** Показывать поиск в хедере */
    search: boolean;
    /** Хедер прилипает к верху при прокрутке */
    sticky: boolean;
  };
  footer: {
    columns: { title: string; links: NavLink[] }[];
    legal: NavLink[];
    /** `{year}` заменяется на текущий год */
    copyright: string;
  };
  contacts: {
    phone?: string;
    email?: string;
    address?: string;
    workingHours?: string;
  };
  socials: NavLink[];
  auth: {
    /** Картинка во второй колонке форм входа и регистрации (public/…) */
    image: string;
  };
};

export const siteConfig: SiteConfig = {
  name: "Magazine",
  description: "Интернет-магазин",
  locale: "ru",
  header: {
    topBar: { text: "Бесплатная доставка от 3 000 ₽", href: "/delivery" },
    navigation: [
      { label: "Каталог", href: routes.catalog },
      { label: "Новинки", href: "/new" },
      { label: "Акции", href: "/sale" },
    ],
    search: true,
    sticky: true,
  },
  footer: {
    columns: [
      {
        title: "Покупателям",
        links: [
          { label: "Доставка", href: "/delivery" },
          { label: "Оплата", href: "/payment" },
          { label: "Возврат", href: "/returns" },
        ],
      },
      {
        title: "Компания",
        links: [
          { label: "О нас", href: "/about" },
          { label: "Контакты", href: "/contacts" },
        ],
      },
    ],
    legal: [
      { label: "Политика конфиденциальности", href: routes.privacy },
      { label: "Пользовательское соглашение", href: routes.terms },
    ],
    copyright: "© {year} Magazine",
  },
  contacts: {
    phone: "+7 (000) 000-00-00",
    email: "shop@example.com",
  },
  socials: [],
  auth: {
    image: "/placeholder.svg",
  },
};
