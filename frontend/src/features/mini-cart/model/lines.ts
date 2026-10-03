import type { StoreCart, StoreCartLineItem } from "@shared/api";
import { routes, type ProductOptionConfig } from "@shared/config";
import { formatPrice } from "@shared/lib/format-price";

/** Строка шторки корзины: всё уже посчитано и отформатировано */
export type CartLineView = {
  id: string;
  title: string;
  /** Ссылка на товар с выбранным вариантом. Нет handle — название без ссылки */
  href?: string;
  image?: { src: string; alt: string };
  /** Значения опций варианта: «Бежевый / M» */
  options?: string;
  /** Сумма строки: цена × количество, со скидками */
  price: string;
  quantity: number;
};

/** Название варианта у товара без опций — в строке не показываем */
const DEFAULT_VARIANT_TITLE = "Default variant";

/**
 * «Бежевый / M»: значения из названия варианта Medusa («Beige / M»), подписи — из labels опций
 * siteConfig.product.options. Связь variant.options store-API корзины не отдаёт, название варианта есть всегда.
 */
export function lineOptions(item: StoreCartLineItem, options: ProductOptionConfig[]): string | undefined {
  const title = item.variantTitle || item.variant?.title;
  if (!title || title === DEFAULT_VARIANT_TITLE) return undefined;

  const labels: Record<string, string> = Object.assign({}, ...options.map((option) => option.labels ?? {}));
  return title
    .split(" / ")
    .map((value) => labels[value] ?? value)
    .join(" / ");
}

/** Позиции корзины в порядке добавления: изменение количества не переставляет строки */
export function toCartLines(cart: StoreCart, options: ProductOptionConfig[]): CartLineView[] {
  const items = [...(cart.items ?? [])].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));

  return items.map((item) => {
    const title = item.productTitle || item.title;
    const handle = item.productHandle ?? item.product?.handle;
    return {
      id: item.id,
      title,
      href: handle ? routes.product(handle, item.variantId) : undefined,
      image: item.thumbnail ? { src: item.thumbnail, alt: title } : undefined,
      options: lineOptions(item, options),
      price: formatPrice(item.total ?? item.unitPrice * item.quantity, cart.currencyCode),
      quantity: item.quantity,
    };
  });
}

/** Сумма товаров для кнопки оформления — без доставки: её посчитают на оформлении */
export function cartItemsTotal(cart: StoreCart): string {
  return formatPrice(cart.itemTotal, cart.currencyCode);
}
