/**
 * Цена для витрины: «29 800 ₽». Medusa 2 хранит суммы в основных единицах (рубли, не копейки).
 * Копейки показываются, только если они есть.
 */
export function formatPrice(amount: number, currencyCode: string, locale = "ru-RU") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}
