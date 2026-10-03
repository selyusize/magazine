/** Цвет товара для свотча в карточке */
export type ProductColor = {
  name: string;
  /** CSS-цвет кружка: #b8967b */
  value: string;
};

/** Данные карточки товара в списках: подборки, каталог, поиск */
export type ProductCardData = {
  id: string;
  title: string;
  href: string;
  /** Минимальная цена среди вариантов. Нет — регион без цен, карточка без строки цены */
  price?: {
    /** В основных единицах валюты, как в Medusa 2 */
    amount: number;
    currencyCode: string;
  };
  /** Нет фото в Medusa — серая подложка */
  image?: {
    src: string;
    /** Описание фото для поисковиков и скринридеров */
    alt: string;
  };
  /** Доступные цвета; первый — показан на фото */
  colors?: ProductColor[];
};

/** Фото товара */
export type ProductImage = { src: string; alt: string };

/** Цена варианта в основных единицах валюты (как в Medusa 2) */
export type ProductPrice = {
  amount: number;
  /** Цена без скидки: больше amount — товар со скидкой (прайс-лист, распродажа) */
  originalAmount?: number;
  currencyCode: string;
};

/** Значение опции: «Beige», «M». metadata — из админки Medusa (`swatch` — цвет кружка) */
export type ProductOptionValue = { value: string; metadata?: Record<string, unknown> };

/** Опция товара («Color», «Size») со значениями по rank из админки */
export type ProductOption = { id: string; title: string; values: ProductOptionValue[] };

/** Выбранные значения опций: `{ Color: "Beige", Size: "M" }` (ключ — название опции) */
export type OptionSelection = Record<string, string>;

/** Вариант товара — то, что кладётся в корзину */
export type ProductVariant = {
  id: string;
  title: string;
  sku?: string;
  /** Штрихкод для разметки gtin: EAN, UPC или barcode */
  gtin?: string;
  /** Значения опций варианта: `{ Color: "Beige", Size: "M" }` */
  options: OptionSelection;
  /** Нет — у региона нет цены, купить нельзя */
  price?: ProductPrice;
  /** Есть на складе, учёт остатков выключен или разрешён предзаказ */
  inStock: boolean;
  /** Свои фото варианта (цвет). Пусто — фото товара */
  images: ProductImage[];
};

/** Раздел каталога товара — для хлебных крошек */
export type ProductCategoryLink = { name: string; href: string };

/** Всё о товаре для его страницы. Только данные, без форматирования */
export type ProductDetail = {
  id: string;
  handle: string;
  title: string;
  subtitle?: string;
  /** Абзацы описания */
  description: string[];
  href: string;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  /** Цепочка разделов от верхнего до категории товара: «Одежда → Свитеры» */
  categories: ProductCategoryLink[];
  /** id всех категорий товара — для подборок «из того же раздела» */
  categoryIds: string[];
  collection?: ProductCategoryLink;
  type?: string;
  material?: string;
  /** ISO-код страны: `ru`, `it` */
  originCountry?: string;
  weight?: number;
  /** Длина × ширина × высота */
  dimensions?: [number, number, number];
  /** Произвольные поля товара из админки: состав, уход, SEO-заголовок, бренд */
  metadata: Record<string, unknown>;
};
