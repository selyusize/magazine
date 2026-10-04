import { useQuery } from "@tanstack/react-query";

import { adminFetch } from "../../lib/admin-fetch";

export type ProductShop = { id: string; slug: string; name: string };

/**
 * Магазин товара (`GET /admin/products/:id/shop`): блоки карточки ходят в разделы его магазина, а не магазина
 * из переключателя — карточку товара открывают из общего списка Medusa.
 */
export function useProductShop(productId: string) {
  return useQuery({
    queryKey: ["admin-product-shop", productId],
    queryFn: () =>
      adminFetch<{ shop: ProductShop }>(`/admin/products/${productId}/shop`),
    select: (data) => data.shop,
  });
}
