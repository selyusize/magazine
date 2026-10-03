/**
 * Валюты, в которых поисковый индекс хранит цены (поля `min_price_<валюта>`). Держите в синхроне с
 * `PRICE_CURRENCIES` в backend/src/search/helpers/pricing.ts. Для валюты региона вне списка
 * фильтр по цене скрыт.
 */
export const SEARCH_PRICE_CURRENCIES = ["eur", "usd"] as const;

/** Поле индекса с ценой самого дешёвого варианта в валюте. Валюты нет в индексе — undefined */
export function searchPriceField(currencyCode: string | undefined): string | undefined {
  const currency = currencyCode?.toLowerCase();
  return SEARCH_PRICE_CURRENCIES.find((item) => item === currency) && `min_price_${currency}`;
}
