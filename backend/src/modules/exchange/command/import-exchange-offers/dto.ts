import type { CMLOffer } from "../../service/commerceml/types";

/**
 * Итог пачки. `created` — товары поставщика (`external_id`), получившие новую карточку, `linked` — склеенные
 * с карточкой другого поставщика. `deferred` — новые варианты существующих карточек (`add-exchange-variants`).
 */
export type ImportedExchangeOffersDTO = {
  created: string[];
  linked: string[];
  offers: { created: number; updated: number };
  prices: number;
  deferred: { product_id: string; external_id: string; offers: CMLOffer[] }[];
  errors: { external_id: string | null; message: string }[];
};
