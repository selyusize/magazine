import { useEffect, useState } from "react";

import { oneOf } from "../../lib/narrow";
import { useExchangeSuppliers } from "./exchange-api";

export const EXCHANGE_TABS = ["settings", "runs", "groups", "properties", "review"] as const;
export type ExchangeTab = (typeof EXCHANGE_TABS)[number];

/**
 * Страница импорта: какой поставщик и какая вкладка. Поставщики — текущего магазина; выбранного нет в списке
 * (первый вход, сменили магазин) — первый поставщик.
 */
export function useExchangePage() {
  const suppliers = useExchangeSuppliers();
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [tab, setTab] = useState<ExchangeTab>("runs");
  const supplier = suppliers.data?.find((item) => item.id === supplierId) ?? null;

  useEffect(() => {
    if (!supplier && suppliers.data?.length) setSupplierId(suppliers.data[0].id);
  }, [supplier, suppliers.data]);

  return {
    suppliers: suppliers.data ?? [],
    isLoading: suppliers.isLoading,
    error: suppliers.error,
    supplier,
    setSupplierId,
    tab,
    setTab: (value: string) => setTab(oneOf(value, EXCHANGE_TABS, "runs")),
  };
}
