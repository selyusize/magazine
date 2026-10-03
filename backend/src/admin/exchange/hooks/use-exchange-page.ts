import { useEffect, useState } from "react";

import { oneOf } from "../../lib/narrow";
import { useExchangeSuppliers } from "./exchange-api";

export const EXCHANGE_TABS = ["settings", "runs", "groups", "properties", "review"] as const;
export type ExchangeTab = (typeof EXCHANGE_TABS)[number];

/** Страница импорта: какой поставщик и какая вкладка. По умолчанию — первый поставщик. */
export function useExchangePage() {
  const suppliers = useExchangeSuppliers();
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [tab, setTab] = useState<ExchangeTab>("runs");

  useEffect(() => {
    if (!supplierId && suppliers.data?.length) setSupplierId(suppliers.data[0].id);
  }, [supplierId, suppliers.data]);

  return {
    suppliers: suppliers.data ?? [],
    isLoading: suppliers.isLoading,
    error: suppliers.error,
    supplier: suppliers.data?.find((supplier) => supplier.id === supplierId) ?? null,
    setSupplierId,
    tab,
    setTab: (value: string) => setTab(oneOf(value, EXCHANGE_TABS, "runs")),
  };
}
