import type { StoreProduct } from "@shared/api";
import { routes } from "@shared/config";

import type { ProductCardData } from "./types";

/** Минимальная цена среди вариантов: «от 4 900 ₽» в списках. */
function minPrice(product: StoreProduct): ProductCardData["price"] {
  const prices = (product.variants ?? []).flatMap((variant) => {
    const price = variant.calculatedPrice;
    return price && typeof price.calculatedAmount === "number"
      ? [{ amount: price.calculatedAmount, currencyCode: price.currencyCode }]
      : [];
  });
  return prices.reduce<ProductCardData["price"]>((min, price) => (!min || price.amount < min.amount ? price : min), undefined);
}

/** Товар Medusa → данные карточки. Единственное место, которое знает форму ответа /store/products. */
export function fromStoreProduct(product: StoreProduct): ProductCardData {
  const src = product.thumbnail || product.images?.[0]?.url;

  return {
    id: product.id,
    title: product.title,
    href: routes.product(product.handle),
    price: minPrice(product),
    // Alt по названию: подписи фото в Medusa обычно нет, а пустой alt хуже для поиска по картинкам
    image: src ? { src, alt: product.title } : undefined,
  };
}
