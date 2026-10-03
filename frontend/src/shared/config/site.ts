import type { PluralForms } from "@shared/lib/plural";

import type { IconName } from "./icons";
import { routes } from "./routes";

/**
 * Настройки конкретного магазина. Чтобы сделать из шаблона новый магазин (очки, продукты, …),
 * обычно достаточно поменять этот файл — хедер, футер и метаданные берут данные отсюда.
 */
export type NavLink = {
  label: string;
  href: string;
  /**
   * Вложенные пункты. Простые ссылки — выпадающий список;
   * если у пунктов есть свои children — мега-меню, где каждый пункт становится колонкой.
   */
  children?: NavLink[];
  /** Фото в мега-меню справа от колонок (public/…) */
  image?: { src: string; alt: string };
};

/** Источник числа рядом с иконкой в хедере */
export type HeaderCounter = "cart" | "wishlist";

/** Шторка, которую открывает действие хедера вместо перехода по ссылке */
export type HeaderPanel = "cart";

/** Ссылка в правой части хедера: иконка (подпись уходит в aria-label) или текст */
export type HeaderAction = {
  label: string;
  href: string;
  /** Без иконки показывается текст label */
  icon?: IconName;
  counter?: HeaderCounter;
  /** Открывать шторку вместо перехода. Шторка выключена в конфиге (cart: null) — обычная ссылка href */
  panel?: HeaderPanel;
  /** Показывать в хедере на мобильных. false — только в мобильном меню */
  mobile?: boolean;
};

/** Соцсеть: иконка из реестра (подпись уходит в aria-label) или текст. Ссылки попадают в JSON-LD sameAs */
export type SocialLink = {
  label: string;
  href: string;
  icon?: IconName;
};

export type FooterColumn = { title: string; links: NavLink[] };

/**
 * Промо-попап (Figma: Promotion). Показывается один раз по триггеру, закрытие запоминается.
 * Не попадает в HTML страницы: не мешает индексации и не считается навязчивым межстраничным окном.
 */
export type PromoPopupConfig = {
  /** Имя кампании. Новое имя — новая кампания: попап снова увидят те, кто закрыл прошлый */
  id: string;
  /** Надзаголовок: «Оставьте email и получите» */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Фото рядом с текстом (public/… или CDN). На мобильных скрыто, как в макете */
  image?: { src: string; alt: string };
  /** С какой стороны фото на десктопе */
  imagePosition?: "start" | "end";
  /** Форма подписки. null — попап без формы: только текст и кнопка-ссылка (cta) */
  form: { placeholder: string; submitLabel: string; successMessage: string } | null;
  /** Ссылка-кнопка вместо формы или под ней: «Смотреть распродажу» */
  cta?: NavLink;
  /**
   * Когда показать — срабатывает первое из заданных:
   * delay — через N мс на странице, scrollDepth — после прокрутки доли страницы (0…1),
   * exitIntent — курсор ушёл к верхнему краю окна (только мышь).
   */
  trigger: { delay?: number; scrollDepth?: number; exitIntent?: boolean };
  /** Через сколько дней показать снова после закрытия. После подписки — больше никогда */
  dismissDays: number;
  /** Не показывать на путях, начинающихся с этих префиксов (корзина, личный кабинет) */
  excludePaths?: string[];
};

/** Поиск по товарам (Figma: Search, Search results): панель под хедером и страница результатов. */
export type SearchConfig = {
  /** Подпись поля и кнопки для скринридеров; заголовок h1 страницы поиска */
  label: string;
  placeholder: string;
  /** Сколько товаров показать в панели под хедером. Остальные — по ссылке на страницу поиска */
  previewLimit: number;
  /** Товаров на одной странице результатов */
  pageSize: number;
  /** С какой длины запроса искать на лету (в панели). Страница поиска ищет по любому запросу */
  minLength: number;
  /** Пауза после ввода перед запросом в панели, мс */
  debounceMs: number;
  /** Склонение числа результатов: «1 товар», «3 товара», «13 товаров» */
  countForms: PluralForms;
  viewAllLabel: string;
  /** Нет результатов. `{query}` заменяется на запрос */
  emptyText: string;
};

/** Шторка корзины (Figma: Shopping bag): открывается иконкой в хедере и из уведомления «Товар добавлен» */
export type CartConfig = {
  /** Заголовок шторки */
  title: string;
  /** Текст над кнопкой оформления: «Стоимость доставки рассчитаем при оформлении». Нет — не выводится */
  note?: string;
  /** Кнопка оформления; сумма товаров — справа от подписи */
  checkoutLabel: string;
  emptyText: string;
  /** Ссылка в пустой корзине: «Перейти в каталог» */
  emptyLink?: NavLink;
  /** Подписи кнопок для скринридеров */
  removeLabel: string;
  quantityLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
};

/** Вариант сортировки каталога: `?sort=<value>` в URL → `order` в запросе к Medusa */
export type CatalogSortOption = {
  /** Значение в URL: латиница, без пробелов */
  value: string;
  label: string;
  /**
   * Поле сортировки поискового индекса товаров: `-created_at`, `title`. Минус — по убыванию.
   * Не задано — порядок индекса по умолчанию. Сортируемые поля — в backend/src/search/product.ts
   */
  order?: string;
};

/**
 * Откуда фильтр берёт значения — поле поискового индекса товаров (backend/src/search/product.ts).
 * Значения и счётчики приходят из индекса: у фильтра видны только те, что есть у товаров текущей выдачи.
 */
export type CatalogFilterSource =
  /** Значения опции товара: название опции как в админке Medusa — «Color», «Size» */
  | { option: string }
  /** Категории товара (по названию) или теги */
  | { field: "category" | "labels" };

type CatalogFilterBase = {
  /** Параметр в URL: латиница, без пробелов. Не `page` и не `sort` */
  key: string;
  /** Заголовок секции в шторке */
  label: string;
};

/** Значение → подпись. Порядок ключей — порядок в списке; значения без подписи — в конце, как есть */
type CatalogFilterLabels = Record<string, string>;

/**
 * Фильтр каталога. Тип задаёт вид и логику:
 * - checkbox — список, можно выбрать несколько (`?size=S&size=M` — любой из);
 * - radio — список, одно значение;
 * - color — кружки цветов, можно выбрать несколько;
 * - range — слайдер «от — до» (`?price=1000-5000`).
 * Разные фильтры складываются через «И».
 */
export type CatalogFilter =
  | (CatalogFilterBase & { type: "checkbox" | "radio"; source: CatalogFilterSource; labels?: CatalogFilterLabels })
  | (CatalogFilterBase & {
      type: "color";
      source: CatalogFilterSource;
      /** Значение → CSS-цвет кружка. Цвет без записи — серый кружок с подписью во всплывающей подсказке */
      swatches: Record<string, string>;
      labels?: CatalogFilterLabels;
    })
  | (CatalogFilterBase & {
      type: "range";
      /** Цена товара (самый дешёвый вариант) в валюте региона */
      source: "price";
      /** Шаг слайдера. По умолчанию 1 */
      step?: number;
    });

/** Фильтры каталога (Figma: Filters): кнопка в шапке каталога и шторка справа */
export type CatalogFilterConfig = {
  /** Подпись кнопки и заголовок шторки */
  label: string;
  applyLabel: string;
  resetLabel: string;
  /** Под фильтрами ничего не нашлось */
  emptyText: string;
  /** Порядок секций — как в массиве. Секция без значений в текущей выдаче скрыта */
  items: CatalogFilter[];
};

/** Каталог (Figma: Product Listing): /catalog и /catalog/[handle]. */
export type CatalogConfig = {
  /** Заголовок h1 страницы всего каталога; у категории — её название */
  title: string;
  description?: string;
  /** Товаров на странице */
  pageSize: number;
  /** Колонок сетки с lg (до lg — две) */
  columns: 2 | 3 | 4 | 5 | 6;
  /** Подпись кнопки и заголовок шторки сортировки */
  sortLabel: string;
  /** Первый вариант — по умолчанию (адрес без ?sort) */
  sort: CatalogSortOption[];
  /** В категории без товаров */
  emptyText: string;
  /** Фильтры. null — кнопки фильтров нет */
  filter: CatalogFilterConfig | null;
};

/**
 * Таблица размеров у выбора опции: ссылка на страницу с таблицей (её проиндексируют) или таблица во всплывающем окне
 */
export type ProductSizeGuide =
  | { label: string; href: string }
  | {
      label: string;
      /** Заголовок окна */
      title: string;
      /** Первая строка — заголовки колонок */
      table: string[][];
      /** Текст под таблицей: как снять мерки */
      note?: string;
    };

/**
 * Как показать опцию товара (опции и значения заводятся в админке Medusa).
 * Опции без записи в конфиге — кнопками с названием опции; опция с одним значением без записи скрыта.
 */
export type ProductOptionConfig = {
  /** Название опции как в админке Medusa: «Color», «Size» */
  option: string;
  /** Подпись группы: «Цвет». По умолчанию — название опции */
  label?: string;
  /**
   * color — кружки цветов, button — кнопки со значением (размеры, объём),
   * select — выпадающий список (много значений: длина, номер кольца)
   */
  type: "color" | "button" | "select";
  /** Значение → подпись: Beige → «Бежевый». Значения без подписи — как есть */
  labels?: Record<string, string>;
  /**
   * Значение → CSS-цвет кружка (для type: color). Значения без записи берут цвет из metadata.swatch значения
   * опции в Medusa, иначе — серый кружок
   */
  swatches?: Record<string, string>;
  /** Выбрать первое доступное значение при открытии страницы. Размер лучше не выбирать за покупателя */
  preselect?: boolean;
  /** Ссылка «Таблица размеров» справа от подписи группы */
  guide?: ProductSizeGuide;
  /**
   * Свойство schema.org, которым различаются варианты (ProductGroup.variesBy): color, size, material, pattern…
   * Нужно для расширенных сниппетов с вариантами. Не задано — опция в разметке только в названии варианта
   */
  schemaProperty?: "color" | "size" | "material" | "pattern" | "suggestedAge" | "suggestedGender";
};

/** Откуда взять характеристику товара для списка «Характеристики» */
export type ProductAttributeSource =
  | "material"
  | "originCountry"
  | "weight"
  | "dimensions"
  | "sku"
  | "type"
  | "collection"
  /** Произвольное поле: metadata товара в Medusa, например `{ metadata: "composition" }` */
  | { metadata: string };

/**
 * Раскрывающийся блок под кнопкой покупки (Figma: Product detail — «Fit Details», «Fabrication & Care»…).
 * Текст всех блоков — в HTML страницы (видят поисковики), пустой блок скрыт.
 */
export type ProductSection = { id: string; title: string } & (
  | /** Полное описание товара из Medusa */ { type: "description" }
  /** Текст из metadata товара: у каждого товара свой (посадка, уход). Абзацы — через пустую строку */
  | { type: "metadata"; key: string }
  /** Список «название — значение» (характеристики) */
  | { type: "attributes"; items: { label: string; source: ProductAttributeSource }[] }
  /** Общий для всех товаров текст (доставка, возврат). Абзацы — элементы массива */
  | { type: "text"; content: string[]; link?: NavLink }
);

/** Страница товара (Figma: Product detail): /products/[handle]. */
export type ProductPageConfig = {
  gallery: {
    /**
     * Фото на десктопе: stack — столбиком с точками-навигацией слева (колонка покупки прилипает при прокрутке),
     * slider — листаются по одному. На мобильных — всегда слайдер
     */
    layout: "stack" | "slider";
    /** Пропорции фото: `1 / 1`, `4 / 5`. Фото обрезается по центру */
    aspectRatio: string;
    /** Подпись галереи для скринридеров */
    label: string;
  };
  /** Короткий текст под ценой: описание товара, подзаголовок (subtitle) или ничего */
  summary: "description" | "subtitle" | null;
  /** Порядок и вид групп опций. Опции товара без записи — в конце, кнопками */
  options: ProductOptionConfig[];
  /** Тексты кнопки покупки и уведомлений */
  cart: {
    addLabel: string;
    /** Выбраны не все опции. `{option}` — подпись первой невыбранной строчными: «Выберите размер» */
    selectLabel: string;
    soldOutLabel: string;
    /** Уведомление после добавления и ссылка в корзину */
    addedMessage: string;
    cartLabel: string;
  };
  /** «от 4 900 ₽» — у вариантов разные цены и вариант не выбран. `{price}` — минимальная цена */
  priceFromLabel: string;
  /** Подпись скидки на старой цене для скринридеров: «Старая цена» */
  oldPriceLabel: string;
  /** Раскрывающиеся блоки под кнопкой покупки. Порядок — как в массиве */
  sections: ProductSection[];
  /**
   * Блоки под первым экраном. Контент у каждого товара свой — JSON в metadata товара в Medusa (ключ metadataKey).
   * null — блока нет. У товара без данных блок не выводится
   */
  content: {
    /** Особенности: колонки «надзаголовок / заголовок / текст». title — заголовок h2 только для поисковиков */
    highlights: { metadataKey: string; title: string } | null;
    /** Лукбук: заголовок, подзаголовок и сетка фото товара в образах */
    lookbook: { metadataKey: string; columns: 2 | 3 } | null;
  };
  /** Отзывы под лукбуком (Figma: Product detail — Reviews). null — блока нет */
  reviews: {
    /** Заголовок секции h2. titleHidden — только для поисковиков и скринридеров, как в макете */
    title: string;
    titleHidden: boolean;
    /** Отзывов на странице. Остальные — по ссылкам пагинации (`?reviews=2`), их видят поисковики */
    pageSize: number;
    /** Параметр номера страницы отзывов в адресе. Не `variant` */
    pageParam: string;
    verifiedLabel: string;
    /** «На основе {count}»: `{count}` — число со склонением из countForms */
    countLabel: string;
    /** Склонение после «на основе»: «1 отзыва», «3 отзывов», «14 отзывов» */
    countForms: PluralForms;
    /** У товара нет отзывов */
    emptyText: string;
  } | null;
  /**
   * «Носите с» под отзывами: товары из `metadata[metadataKey]` (handle через запятую или JSON-массив),
   * не заданы — из тех же категорий. null — блока нет
   */
  related: { title: string; metadataKey: string; limit: number } | null;
  /** «Вы недавно смотрели»: последние открытые товары из браузера покупателя. null — блока нет */
  recentlyViewed: { title: string; limit: number } | null;
  /** Единицы веса и размеров товара — как они заведены в Medusa */
  units: { weight: string; length: string };
  /**
   * Бренд в разметке Product для поисковиков. По умолчанию — название магазина;
   * у товара другой бренд — `metadata.brand` в Medusa
   */
  brand?: string;
};

/**
 * Хлебные крошки: цепочка разделов над заголовком страницы и разметка BreadcrumbList для поисковиков —
 * Яндекс и Google показывают её в сниппете вместо адреса.
 */
export type BreadcrumbsConfig = {
  /** Подпись навигации для скринридеров */
  label: string;
  /** Первая крошка — главная страница. null — цепочка начинается с раздела */
  home: string | null;
  /**
   * Кнопка «назад» — ссылка на родительский раздел с его названием («‹ Одежда»):
   * mobile — на мобильных вместо цепочки, always — вместо цепочки везде, never — только цепочка.
   * Разметка для поисковиков выводится при любом варианте
   */
  back: "mobile" | "always" | "never";
};

export type SiteConfig = {
  name: string;
  description: string;
  /** Язык страниц (<html lang>) */
  locale: string;
  /** Тема по умолчанию. system — как в ОС (нужна проработанная тёмная тема в tokens.css) */
  theme: "light" | "dark" | "system";
  /**
   * Логотип (public/…). alt — название магазина.
   * invertInDark — одноцветный тёмный логотип инвертируется в тёмной теме
   */
  logo: { src: string; width: number; height: number; invertInDark?: boolean };
  header: {
    /**
     * Раскладка на десктопе (на мобильных всегда: меню | логотип | действия):
     * - inline — логотип и навигация слева, действия справа;
     * - centered — навигация слева, логотип по центру, действия справа.
     */
    variant: "inline" | "centered";
    /** Полоса над хедером (акция, доставка). null — не показывать */
    topBar: { text: string; link?: NavLink } | null;
    navigation: NavLink[];
    /**
     * Поиск в хедере (тексты и лимиты — в siteConfig.search):
     * panel — иконка открывает панель поиска под хедером с результатами на лету (Figma: Search),
     * icon — ссылка на страницу поиска, field — поле ввода прямо в хедере. null — не показывать
     */
    search: { variant: "panel" | "icon" | "field" } | null;
    actions: HeaderAction[];
    /** Хедер прилипает к верху при прокрутке */
    sticky: boolean;
  };
  footer: {
    /** Колонка с контактами (данные — в contacts). null — не показывать */
    contacts: { title: string } | null;
    /** Колонки ссылок. Порядок — как в массиве, количество любое */
    columns: FooterColumn[];
    /** Форма подписки на рассылку. null — не показывать */
    newsletter: {
      title: string;
      placeholder: string;
      submitLabel: string;
      /** Текст после успешной подписки */
      successMessage: string;
    } | null;
    /** Ссылки рядом с копирайтом (реквизиты, оферта). Пусто — только копирайт */
    legal: NavLink[];
    /** `{year}` заменяется на текущий год */
    copyright: string;
  };
  /** Контакты магазина: футер и разметка Organization для поисковиков */
  contacts: {
    /** В любом формате: для ссылки tel: лишние символы отбрасываются */
    phone?: string;
    email?: string;
    address?: string;
    workingHours?: string;
  };
  socials: SocialLink[];
  auth: {
    /** Картинка во второй колонке форм входа и регистрации (public/…) */
    image: string;
  };
  /** Хлебные крошки. null — не показывать (и не выводить разметку для поисковиков) */
  breadcrumbs: BreadcrumbsConfig | null;
  catalog: CatalogConfig;
  product: ProductPageConfig;
  /** Поиск по товарам. null — страницы поиска и поиска в хедере нет */
  search: SearchConfig | null;
  /** Шторка корзины. null — иконка корзины ведёт на страницу корзины */
  cart: CartConfig | null;
  /** Промо-попап. null — не показывать */
  promoPopup: PromoPopupConfig | null;
};

/** Цвета опции «Color» из Medusa: кружки в фильтре каталога и на странице товара */
const colorSwatches: Record<string, string> = {
  Beige: "#cfac94",
  Black: "#000000",
  Blue: "#2f78bf",
  Brown: "#935a40",
  Green: "#4b8040",
  Taupe: "#a6877a",
  Orange: "#eb6029",
  Red: "#da2f3a",
  Cream: "#f4e3d4",
  White: "#ffffff",
};

const colorLabels: Record<string, string> = {
  Beige: "Бежевый",
  Black: "Чёрный",
  Blue: "Синий",
  Brown: "Коричневый",
  Green: "Зелёный",
  Taupe: "Серо-коричневый",
  Orange: "Оранжевый",
  Red: "Красный",
  Cream: "Кремовый",
  White: "Белый",
};

export const siteConfig: SiteConfig = {
  name: "Magazine",
  description: "Интернет-магазин",
  locale: "ru",
  // Как в ОС. Тёмной темы в макете нет — её цвета в tokens.css (.dark) подобраны из той же палитры
  theme: "system",
  logo: { src: "/logo.svg", width: 86, height: 20, invertInDark: true },
  header: {
    variant: "inline",
    topBar: {
      text: "Бесплатная доставка по России при заказе от 9 500 ₽.",
      link: { label: "Перейти в каталог", href: routes.catalog },
    },
    navigation: [
      {
        label: "Каталог",
        href: routes.catalog,
        children: [
          {
            label: "Категории",
            href: routes.catalog,
            children: [
              { label: "Сумки", href: routes.category("bags") },
              { label: "Одежда", href: routes.category("clothing") },
              { label: "Кожгалантерея", href: routes.category("leather-goods") },
              { label: "Аксессуары", href: routes.category("accessories") },
              { label: "Подарки", href: routes.category("gifts") },
              { label: "Все товары", href: routes.catalog },
            ],
          },
          {
            label: "Подборки",
            href: routes.collection("featured"),
            children: [
              { label: "Новинки", href: "/new" },
              { label: "Хиты продаж", href: routes.collection("best-sellers") },
              { label: "В тренде", href: routes.collection("trending") },
              { label: "Домашняя одежда", href: routes.collection("loungewear") },
            ],
          },
          {
            label: "Коллекции",
            href: routes.collection("all"),
            children: [
              { label: "Вечерние образы", href: routes.collection("party") },
              { label: "Для офиса", href: routes.collection("office") },
              { label: "Выбор стилиста", href: routes.collection("selection") },
              { label: "Только онлайн", href: routes.collection("online-exclusive") },
              { label: "Трикотаж", href: routes.collection("knitwear") },
              { label: "Тотал-лук", href: routes.collection("total-look") },
              { label: "Базовый гардероб", href: routes.collection("basics") },
            ],
          },
        ],
        image: { src: "/images/menu/catalog.jpg", alt: "Модель в бежевом трикотажном кардигане и брюках" },
      },
      { label: "Новинки", href: "/new" },
      { label: "Распродажа", href: "/sale" },
      { label: "Журнал", href: "/journal" },
    ],
    search: { variant: "panel" },
    actions: [
      { label: "Магазины", href: routes.stores },
      { label: "Личный кабинет", href: routes.account, icon: "user" },
      { label: "Избранное", href: routes.wishlist, icon: "heart", counter: "wishlist", mobile: true },
      { label: "Корзина", href: routes.cart, icon: "bag", counter: "cart", panel: "cart", mobile: true },
    ],
    sticky: true,
  },
  footer: {
    contacts: { title: "Контакты" },
    columns: [
      {
        title: "Покупателям",
        links: [
          { label: "Доставка и оплата", href: "/delivery" },
          { label: "Оформить возврат", href: "/returns" },
          { label: "Условия возврата", href: "/returns-policy" },
          { label: "Вопросы и ответы", href: "/faq" },
          { label: "Подарочные сертификаты", href: "/gift-cards" },
        ],
      },
      {
        title: "Компания",
        links: [
          { label: "О нас", href: "/about" },
          { label: "Устойчивое развитие", href: "/sustainability" },
          { label: "Магазины", href: routes.stores },
          { label: "Вакансии", href: "/careers" },
          { label: "Политика конфиденциальности", href: routes.privacy },
          { label: "Пользовательское соглашение", href: routes.terms },
        ],
      },
    ],
    newsletter: {
      title: "Узнавайте о новинках первыми",
      placeholder: "Ваш email",
      submitLabel: "Подписаться",
      successMessage: "Спасибо! Вы подписались на рассылку.",
    },
    legal: [],
    copyright: "© {year} Magazine",
  },
  contacts: {
    phone: "+7 (000) 000-00-00",
    email: "shop@example.com",
    workingHours: "Пн–Пт 9:00–18:00 МСК",
  },
  socials: [],
  auth: {
    image: "/placeholder.svg",
  },
  breadcrumbs: {
    label: "Навигационная цепочка",
    home: "Главная",
    back: "mobile",
  },
  catalog: {
    title: "Каталог",
    pageSize: 24,
    columns: 4,
    sortLabel: "Сортировка",
    sort: [
      { value: "featured", label: "Рекомендуем" },
      { value: "new", label: "Сначала новые", order: "-created_at" },
      { value: "title-asc", label: "По названию: А–Я", order: "title" },
      { value: "title-desc", label: "По названию: Я–А", order: "-title" },
    ],
    emptyText: "В этой категории пока нет товаров.",
    filter: {
      label: "Фильтры",
      applyLabel: "Показать товары",
      resetLabel: "Сбросить",
      emptyText: "Под выбранные фильтры товаров нет. Попробуйте убрать часть фильтров.",
      items: [
        {
          key: "color",
          label: "Цвет",
          type: "color",
          source: { option: "Color" },
          swatches: colorSwatches,
          labels: colorLabels,
        },
        { key: "material", label: "Материал", type: "radio", source: { option: "Material" } },
        {
          key: "size",
          label: "Размер",
          type: "checkbox",
          source: { option: "Size" },
          labels: { XS: "XS", S: "S", M: "M", L: "L", XL: "XL" },
        },
        { key: "price", label: "Цена", type: "range", source: "price" },
      ],
    },
  },
  product: {
    gallery: { layout: "stack", aspectRatio: "1 / 1", label: "Фото товара" },
    summary: "description",
    options: [
      { option: "Color", label: "Цвет", type: "color", swatches: colorSwatches, labels: colorLabels, preselect: true, schemaProperty: "color" },
      {
        option: "Size",
        label: "Размер",
        type: "button",
        schemaProperty: "size",
        guide: {
          label: "Таблица размеров",
          title: "Таблица размеров",
          table: [
            ["Размер", "Россия", "Грудь, см", "Талия, см", "Бёдра, см"],
            ["XS", "40–42", "80–84", "62–66", "88–92"],
            ["S", "42–44", "84–88", "66–70", "92–96"],
            ["M", "44–46", "88–92", "70–74", "96–100"],
            ["L", "46–48", "92–96", "74–78", "100–104"],
            ["XL", "48–50", "96–100", "78–82", "104–108"],
          ],
          note: "Обхваты тела, а не изделия. Если вы между размерами, выберите больший.",
        },
      },
      { option: "Material", label: "Материал", type: "button", schemaProperty: "material" },
    ],
    cart: {
      addLabel: "Добавить в корзину",
      selectLabel: "Выберите {option}",
      soldOutLabel: "Нет в наличии",
      addedMessage: "Товар добавлен в корзину",
      cartLabel: "Перейти в корзину",
    },
    priceFromLabel: "от {price}",
    oldPriceLabel: "Цена без скидки",
    sections: [
      { id: "fit", title: "Посадка и размеры", type: "metadata", key: "fit" },
      {
        id: "care",
        title: "Состав и уход",
        type: "attributes",
        items: [
          { label: "Материал", source: "material" },
          { label: "Состав", source: { metadata: "composition" } },
          { label: "Уход", source: { metadata: "care" } },
          { label: "Страна производства", source: "originCountry" },
          { label: "Артикул", source: "sku" },
        ],
      },
      {
        id: "delivery",
        title: "Доставка и возврат",
        type: "text",
        content: [
          "Доставим курьером или в пункт выдачи СДЭК за 1–5 дней. Бесплатно при заказе от 9 500 ₽.",
          "Вернуть товар можно в течение 14 дней, если он не был в носке и сохранил ярлыки.",
        ],
        link: { label: "Подробнее о доставке и оплате", href: "/delivery" },
      },
    ],
    content: {
      highlights: { metadataKey: "highlights", title: "Особенности" },
      lookbook: { metadataKey: "lookbook", columns: 2 },
    },
    reviews: {
      title: "Отзывы",
      titleHidden: true,
      pageSize: 5,
      pageParam: "reviews",
      verifiedLabel: "Проверенный покупатель",
      countLabel: "На основе {count}",
      countForms: ["отзыва", "отзывов", "отзывов"],
      emptyText: "Отзывов пока нет.",
    },
    related: { title: "Носите с", metadataKey: "style_with", limit: 3 },
    recentlyViewed: { title: "Вы недавно смотрели", limit: 3 },
    units: { weight: "г", length: "см" },
  },
  search: {
    label: "Поиск",
    placeholder: "Поиск…",
    previewLimit: 4,
    pageSize: 24,
    minLength: 2,
    debounceMs: 300,
    countForms: ["товар", "товара", "товаров"],
    viewAllLabel: "Смотреть все",
    emptyText: "По запросу «{query}» ничего не найдено. Проверьте написание или попробуйте другие слова.",
  },
  cart: {
    title: "Корзина",
    note: "Стоимость доставки рассчитаем при оформлении",
    checkoutLabel: "Оформить заказ",
    emptyText: "В корзине пока ничего нет",
    emptyLink: { label: "Перейти в каталог", href: routes.catalog },
    removeLabel: "Удалить из корзины",
    quantityLabel: "Количество",
    decreaseLabel: "Уменьшить количество",
    increaseLabel: "Увеличить количество",
  },
  promoPopup: {
    id: "welcome-15",
    eyebrow: "Оставьте email и получите",
    title: "−15% на первый заказ",
    description: "А ещё — первыми узнавайте об акциях, новинках и событиях.",
    // В макете фото доступно только в платной версии — временно фото из коллекций
    image: { src: "/images/collections/ready-to-go.png", alt: "Модель в тёмном джемпере и юбке в клетку" },
    form: {
      placeholder: "Ваш email",
      submitLabel: "Получить скидку",
      successMessage: "Готово! Промокод отправили на почту.",
    },
    trigger: { delay: 15_000, scrollDepth: 0.5, exitIntent: true },
    dismissDays: 7,
    excludePaths: [routes.cart, routes.account],
  },
};
