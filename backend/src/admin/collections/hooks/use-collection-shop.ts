import { toast } from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { adminFetch } from "../../lib/admin-fetch";
import { useShopOptions } from "../../shops/hooks/use-shop-switcher";

export type CollectionShop = { id: string; slug: string; name: string };

const collectionShopKey = (collectionId: string) => ["admin-collection-shop", collectionId];

/**
 * Блок «Магазин» карточки коллекции: дашборд Medusa создаёт коллекцию без магазина, магазин выбирают здесь один раз
 * (`POST /admin/collections/:id/shop`), дальше он только показывается. Сетевые роуты — без `x-shop-id`.
 */
export function useCollectionShop(collectionId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [shopId, setShopId] = useState<string>("");

  const current = useQuery({
    queryKey: collectionShopKey(collectionId),
    queryFn: () =>
      adminFetch<{ shop: CollectionShop | null }>(`/admin/collections/${collectionId}/shop`, {}, null),
    select: (data) => data.shop,
  });
  const shops = useShopOptions();

  const assign = useMutation({
    mutationFn: (id: string) =>
      adminFetch<{ shop: CollectionShop | null }>(
        `/admin/collections/${collectionId}/shop`,
        { method: "POST", body: { shop_id: id } },
        null,
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(collectionShopKey(collectionId), data);
      toast.success(t("collectionShop.saved"));
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    shop: current.data ?? null,
    isLoading: current.isLoading,
    error: current.error,
    options: shops.data ?? [],
    shopId,
    setShopId,
    submit: () => shopId && assign.mutate(shopId),
    isSaving: assign.isPending,
  };
}
