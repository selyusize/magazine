import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { adminFetch } from "../../lib/admin-fetch";
import { isRecord } from "../../lib/narrow";
import { readCurrentShopId, writeCurrentShopId } from "../current-shop";

export type ShopOption = { id: string; name: string; slug: string };

const toShopOptions = (value: unknown): ShopOption[] =>
  Array.isArray(value)
    ? value.flatMap((row) =>
        isRecord(row) && typeof row.id === "string"
          ? [
              {
                id: row.id,
                name: String(row.name ?? row.id),
                slug: String(row.slug ?? ""),
              },
            ]
          : [],
      )
    : [];

/** Магазинов в сети десятки — переключателю хватает одной страницы. */
const SHOPS_LIMIT = 100;

/** Магазины сети для выбора: переключатель, магазин коллекции. */
export function useShopOptions() {
  return useQuery({
    queryKey: ["admin-shop-switcher"],
    queryFn: async () =>
      toShopOptions(
        (
          await adminFetch<Record<string, unknown>>("/admin/shops", {
            query: { limit: SHOPS_LIMIT },
          })
        ).shops,
      ),
  });
}

/**
 * Текущий магазин админки: список магазинов, выбор из localStorage (нет или удалён — первый в списке), смена
 * выбора перезапрашивает все данные страницы уже с новым `x-shop-id`.
 */
export function useShopSwitcher() {
  const queryClient = useQueryClient();
  const [currentId, setCurrentId] = useState(readCurrentShopId);

  const shops = useShopOptions();
  const options = shops.data ?? [];
  const current =
    options.find((shop) => shop.id === currentId) ?? options[0] ?? null;

  // Сохранённого магазина нет в списке (первый вход, магазин выключили из выборки) — запоминаем первый
  useEffect(() => {
    if (current && current.id !== currentId) {
      writeCurrentShopId(current.id);
      setCurrentId(current.id);
    }
  }, [current, currentId]);

  const select = (shopId: string) => {
    if (shopId === current?.id) return;
    writeCurrentShopId(shopId);
    setCurrentId(shopId);
    void queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] !== "admin-shop-switcher",
    });
  };

  return { options, current, isLoading: shops.isLoading, select };
}
