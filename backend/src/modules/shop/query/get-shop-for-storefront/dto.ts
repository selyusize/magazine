/**
 * Магазин для витрины — подвал, шапка, Organization в schema.org. Реквизиты — сетевые (одно юрлицо на все
 * магазины). Не заполнено в админке — `null`.
 */
export type StorefrontShopDTO = {
  slug: string;
  /** Название магазина для покупателя: «Olisa». */
  name: string;
  /** Домен без протокола: `olisa.ru`. */
  domain: string;
  /** Адрес главной страницы: `https://olisa.ru`. */
  url: string;
  logo_url: string | null;
  contacts: {
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  network: {
    /** Название сети: «Snowaa». */
    name: string | null;
    legal: {
      /** Полное наименование: «ООО «Сноуа»». */
      name: string | null;
      inn: string | null;
      /** ОГРН юрлица или ОГРНИП. */
      ogrn: string | null;
      /** У ИП КПП нет. */
      kpp: string | null;
      address: string | null;
    };
    phone: string | null;
    email: string | null;
  };
};
