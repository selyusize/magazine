import type { CMLOffer, CMLPriceType } from "./commerceml/types";
import type { ExchangeSettings } from "./exchange-settings";

/** Опция товара без характеристик: Medusa требует опцию у каждого варианта. */
export const DEFAULT_OPTION = { title: "Вариант", value: "Основной" };

/** Значение опции, которого у варианта нет (у одного предложения есть «Цвет», у другого — нет). */
const MISSING_VALUE = "—";

export type VariantShape = {
  /** «42», «Красный / XL». Уникален внутри товара — по нему созданные варианты сопоставляются с предложениями. */
  title: string;
  options: Record<string, string>;
};

export type ProductShape = {
  options: { title: string; values: string[] }[];
  /** По `external_id` предложения. */
  variants: Map<string, VariantShape>;
};

/**
 * Опции и варианты товара из его предложений: опции — объединение названий характеристик всех предложений,
 * у варианта без характеристики — «—». Два предложения с одинаковыми характеристиками получают суффикс
 * (« (2)»), чтобы варианты не слиплись.
 */
export function shapeProduct(offers: CMLOffer[]): ProductShape {
  const titles = [...new Set(offers.flatMap((offer) => offer.characteristics.map((item) => item.name)))];
  const optionTitles = titles.length ? titles : [DEFAULT_OPTION.title];
  const values = new Map(optionTitles.map((title) => [title, new Set<string>()]));
  const variants = new Map<string, VariantShape>();
  const taken = new Map<string, number>();

  for (const offer of offers) {
    const options: Record<string, string> = {};
    for (const title of optionTitles) {
      const value = titles.length
        ? (offer.characteristics.find((item) => item.name === title)?.value ?? MISSING_VALUE)
        : DEFAULT_OPTION.value;
      options[title] = value;
    }
    let title = Object.values(options).join(" / ");
    const count = (taken.get(title) ?? 0) + 1;
    taken.set(title, count);
    if (count > 1) {
      title = `${title} (${count})`;
      options[optionTitles[0]] = `${options[optionTitles[0]]} (${count})`;
    }
    for (const [name, value] of Object.entries(options)) values.get(name)!.add(value);
    variants.set(offer.external_id, { title, options });
  }

  return {
    options: optionTitles.map((title) => ({ title, values: [...values.get(title)!] })),
    variants,
  };
}

/** Ключ варианта по значениям опций — для поиска уже существующего варианта карточки. */
export function optionsKey(options: Record<string, string>): string {
  return Object.keys(options)
    .sort()
    .map((title) => `${title.toLowerCase()}=${options[title].toLowerCase()}`)
    .join("|");
}

export type OfferPrices = { purchase: number | null; retail: number | null };

/**
 * Закупка и розница предложения по настройкам поставщика. Тип цены ищется по Ид или названию (без регистра);
 * не задан — единственный тип или первая цена. Розница — своя цена поставщика или закупка + наценка, вверх до рубля
 * (правила наценки, округления и выбор предложения — этап 5).
 */
export function offerPrices(
  offer: CMLOffer,
  settings: Pick<ExchangeSettings, "purchase_price_type" | "retail_price_type" | "markup_percent">,
  priceTypes: CMLPriceType[],
): OfferPrices {
  const typeId = (wanted: string | null) => {
    if (!wanted) return null;
    const lower = wanted.toLowerCase();
    return (
      priceTypes.find((type) => type.external_id === wanted || type.name.toLowerCase() === lower)?.external_id ?? wanted
    );
  };
  const priceOf = (id: string | null) =>
    id ? (offer.prices.find((price) => price.price_type_id === id)?.amount ?? null) : null;

  const purchaseType = typeId(settings.purchase_price_type);
  const purchase = purchaseType ? priceOf(purchaseType) : (offer.prices[0]?.amount ?? null);
  const retail =
    priceOf(typeId(settings.retail_price_type)) ??
    (purchase === null ? null : Math.ceil(purchase * (1 + settings.markup_percent / 100)));
  return { purchase, retail };
}
