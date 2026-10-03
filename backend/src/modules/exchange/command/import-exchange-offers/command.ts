import type { CMLOffer, CMLPriceType } from "../../service/commerceml/types";

/**
 * Пачка предложений (`offers.xml`, `prices.xml`, `rests.xml`): все предложения товаров пачки вместе. Типы цен — из
 * пакета, настройки цен — из `supplier.exchange`, `synced_at` — время запуска (ISO).
 */
export type ImportExchangeOffersCommand = {
  supplier_id: string;
  /** Папка пакета — картинки новых карточек. */
  package_dir: string;
  /** Публиковать готовые карточки (`supplier.exchange.publish`). */
  publish: boolean;
  synced_at: string;
  price_types: CMLPriceType[];
  settings: {
    purchase_price_type: string | null;
    retail_price_type: string | null;
    markup_percent: number;
  };
  offers: CMLOffer[];
};
