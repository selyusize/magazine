/**
 * Поля корзины, которые возвращают все запросы/мутации корзины — форма данных всегда одинаковая.
 * Расширяйте под магазин: `+items.variant.metadata`, `*items.product.categories` и т.п.
 * Синтаксис: https://docs.medusajs.com/api/store#select-fields-and-relations
 * Имена здесь — бэкенда (snake_case): это язык выборки Medusa, маппер значения не трогает.
 */
export const CART_FIELDS = [
  "*items",
  "*items.variant",
  "*items.product",
  "+items.thumbnail",
  "+items.metadata",
  "+items.total",
  "*region",
  "*promotions",
  "*shipping_methods",
  "+completed_at",
].join(",");
