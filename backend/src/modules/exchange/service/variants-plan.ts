import type { CMLOffer, CMLPriceType } from "./commerceml/types";
import type { ExchangeSettings } from "./exchange-settings";
import { DEFAULT_OPTION, offerPrices } from "./offer-plan";

/** Опция существующей карточки и её значения. */
export type ProductOption = { id: string; title: string; values: string[] };

export type NewVariantsPlan = {
  /** Значения, которых не хватает опциям карточки. */
  option_values: { product_option_id: string; add: string[] }[];
  variants: {
    external_id: string;
    title: string;
    options: Record<string, string>;
    prices: { amount: number; currency_code: string }[];
    purchase_price: number | null;
  }[];
  errors: { external_id: string; message: string }[];
};

/**
 * Новые варианты существующей карточки из предложений поставщика-владельца. Значения опций берутся из характеристик
 * (у карточки без характеристик — опция по умолчанию); недостающие значения добавляются опциям. Новая
 * характеристика, которой нет среди опций карточки, — ошибка: у старых вариантов для неё нет значения, такой
 * вариант добавляют вручную.
 */
export function planNewVariants(input: {
  offers: CMLOffer[];
  options: ProductOption[];
  variant_titles: string[];
  currency_code: string;
  settings: Pick<ExchangeSettings, "purchase_price_type" | "retail_price_type" | "markup_percent">;
  price_types: CMLPriceType[];
}): NewVariantsPlan {
  const plan: NewVariantsPlan = { option_values: [], variants: [], errors: [] };
  const titles = new Set(input.variant_titles);
  const missing = new Map<string, Set<string>>();
  const byTitle = new Map(input.options.map((option) => [option.title.toLowerCase(), option]));

  for (const offer of input.offers) {
    const characteristics = offer.characteristics.length
      ? offer.characteristics
      : [{ name: DEFAULT_OPTION.title, value: DEFAULT_OPTION.value }];
    const unknown = characteristics.find((item) => !byTitle.has(item.name.toLowerCase()));
    if (unknown) {
      plan.errors.push({
        external_id: offer.external_id,
        message: `у товара новая характеристика «${unknown.name}» — вариант нужно добавить вручную`,
      });
      continue;
    }

    const options: Record<string, string> = {};
    for (const option of input.options)
      options[option.title] =
        characteristics.find((item) => item.name.toLowerCase() === option.title.toLowerCase())?.value ?? "—";

    // Те же значения опций, что у существующего варианта, Medusa не примет — как в shapeProduct, номер в первой опции
    const first = input.options[0].title;
    const plain = options[first];
    let title = Object.values(options).join(" / ");
    for (let index = 2; titles.has(title); index++) {
      options[first] = `${plain} (${index})`;
      title = Object.values(options).join(" / ");
    }
    titles.add(title);
    for (const option of input.options)
      if (!option.values.includes(options[option.title]))
        missing.set(option.id, (missing.get(option.id) ?? new Set()).add(options[option.title]));

    const { purchase, retail } = offerPrices(offer, input.settings, input.price_types);
    plan.variants.push({
      external_id: offer.external_id,
      title,
      options,
      prices: retail === null ? [] : [{ amount: retail, currency_code: input.currency_code }],
      purchase_price: purchase,
    });
  }

  plan.option_values = [...missing].map(([product_option_id, values]) => ({ product_option_id, add: [...values] }));
  return plan;
}
