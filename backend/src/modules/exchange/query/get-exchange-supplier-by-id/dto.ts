import type { ExchangeSettings } from "../../service/exchange-settings";

/** Поставщик глазами обмена: активен ли и как с ним меняться. */
export type ExchangeSupplierDTO = {
  id: string;
  name: string;
  is_active: boolean;
  settings: ExchangeSettings;
};
