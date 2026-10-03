import { useQuery } from "@tanstack/react-query";

import { sdk } from "../../lib/sdk";

type Category = { id: string; name: string; handle: string };

/** Категории магазина для выбора в форме. Дерево плоское — для посадочных этого хватает. */
export function useCategoryOptions(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-crud-categories"],
    queryFn: () =>
      sdk.client.fetch<{ product_categories: Category[] }>(
        "/admin/product-categories",
        {
          query: { fields: "id,name,handle", limit: 1000 },
        },
      ),
    select: (data) => data.product_categories,
    enabled,
  });
}
