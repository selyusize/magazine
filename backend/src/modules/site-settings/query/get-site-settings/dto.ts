/** Реквизиты и контакты магазина: Organization в schema.org и подвал витрины. */
export type SiteSettingsDTO = {
  /** Название магазина для покупателя: «Олиса». */
  name: string;
  /** Домен без протокола: `olisa.ru`. */
  domain: string;
  /** Адрес главной страницы: `https://olisa.ru`. */
  url: string;
  legal: {
    /** Полное наименование: «ООО «Олиса»», «ИП Иванов Иван Иванович». */
    name: string;
    inn: string;
    /** ОГРН для юрлица, ОГРНИП для ИП. */
    ogrn: string;
    /** У ИП КПП нет. */
    kpp: string | null;
    /** Юридический адрес одной строкой — как в выписке ЕГРЮЛ/ЕГРИП. */
    address: string;
  };
  contacts: {
    /** E.164: `+78001234567`. */
    phone: string;
    email: string;
    /** Режим работы для подвала: «Ежедневно с 9:00 до 21:00 (МСК)». */
    working_hours: string;
  };
  /** Почтовый адрес — PostalAddress в schema.org. */
  address: {
    /** ISO 3166-1 alpha-2: `RU`. */
    country_code: string;
    postal_code: string;
    city: string;
    street: string;
  };
  /** Профили в соцсетях — `sameAs` в schema.org и иконки в подвале. */
  social_links: {
    name: string;
    url: string;
  }[];
};
