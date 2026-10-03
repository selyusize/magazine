/** Ссылка на категорию: чипсы подкатегорий, хлебные крошки */
export type CategoryLink = {
  id: string;
  name: string;
  handle: string;
  href: string;
};

/** Категория каталога для страницы списка товаров */
export type Category = CategoryLink & {
  /** Текст под заголовком и meta description. Пусто — нет */
  description?: string;
  parent?: CategoryLink;
  /** Подкатегории по rank из админки */
  children: CategoryLink[];
};
