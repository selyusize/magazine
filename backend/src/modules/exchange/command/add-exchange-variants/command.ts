import type { CMLOffer, CMLPriceType } from "../../service/commerceml/types";

/** Новые варианты существующей карточки поставщика-владельца и их предложения. */
export type AddExchangeVariantsCommand = {
  supplier_id: string;
  product_id: string;
  synced_at: string;
  price_types: CMLPriceType[];
  settings: {
    purchase_price_type: string | null;
    retail_price_type: string | null;
    markup_percent: number;
  };
  offers: CMLOffer[];
};
