import { useQuery } from "@tanstack/react-query";

import { adminFetch } from "../../lib/admin-fetch";

type Category = { id: string; name: string; handle: string };

/**
 * Категории дерева магазина для выбора в форме (`GET /admin/shops/current/categories`): текущего из переключателя
 * или явного `shopId` (карточка товара). Дерево плоское — для выбора этого хватает.
 */
export function useCategoryOptions(enabled: boolean, shopId?: string | null) {
  return useQuery({
    queryKey: ["admin-shop-categories", shopId ?? "current"],
    queryFn: () =>
      adminFetch<{ product_categories: Category[] }>(
        "/admin/shops/current/categories",
        {},
        shopId,
      ),
    select: (data) => data.product_categories,
    enabled: enabled && shopId !== null,
  });
}
