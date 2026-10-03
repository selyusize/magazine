import type { OptionSelection, ProductDetail, ProductImage, ProductPrice, ProductVariant } from "./types";

/**
 * Выбор варианта по опциям — чистые функции без React: их используют страница товара, быстрый просмотр, тесты.
 * Выбор — значения опций по названию (`{ Color: "Beige" }`); вариант определён, когда выбраны все опции.
 */

/**
 * Состояние значения опции при текущем выборе остальных:
 * available — можно купить, soldout — такой вариант есть, но закончился, unavailable — такого сочетания нет
 */
export type OptionValueState = "available" | "soldout" | "unavailable";

/** Вариант подходит под выбор: совпадают все выбранные опции (невыбранные — любые) */
export function matchesSelection(variant: ProductVariant, selection: OptionSelection): boolean {
  return Object.entries(selection).every(([option, value]) => variant.options[option] === value);
}

/** Вариант, если выбраны все опции товара и такое сочетание существует */
export function findVariant(product: ProductDetail, selection: OptionSelection): ProductVariant | undefined {
  if (!product.options.every((option) => selection[option.title])) return undefined;
  return product.variants.find((variant) => matchesSelection(variant, selection));
}

/** Первая невыбранная опция: «Выберите размер» на кнопке покупки */
export function firstMissingOption(product: ProductDetail, selection: OptionSelection): string | undefined {
  return product.options.find((option) => !selection[option.title])?.title;
}

/** Что будет, если выбрать значение при текущем выборе остальных опций */
export function optionValueState(
  product: ProductDetail,
  selection: OptionSelection,
  option: string,
  value: string,
): OptionValueState {
  const rest = Object.fromEntries(Object.entries(selection).filter(([key]) => key !== option));
  const candidates = product.variants.filter((variant) => variant.options[option] === value && matchesSelection(variant, rest));
  if (!candidates.length) return "unavailable";
  return candidates.some((variant) => variant.inStock && variant.price) ? "available" : "soldout";
}

/**
 * Выбрать значение опции. Остальные выбранные значения сохраняются, если с новым сочетание существует,
 * иначе сбрасываются: выбрали цвет, которого нет в размере M, — размер нужно выбрать заново.
 */
export function selectOptionValue(product: ProductDetail, selection: OptionSelection, option: string, value: string): OptionSelection {
  const next: OptionSelection = { [option]: value };
  for (const { title } of product.options) {
    const current = selection[title];
    if (title === option || !current) continue;
    if (product.variants.some((variant) => matchesSelection(variant, { ...next, [title]: current }))) next[title] = current;
  }
  // Порядок ключей — как у опций товара: стабильное сравнение и сериализация
  return Object.fromEntries(product.options.flatMap(({ title }) => (next[title] ? [[title, next[title]]] : [])));
}

/**
 * Выбор при открытии страницы: вариант из ссылки (`?variant=`), иначе — опции с единственным значением
 * и опции из preselect (первое доступное значение). Остальное покупатель выбирает сам.
 */
export function initialSelection(
  product: ProductDetail,
  { variantId, preselect = [] }: { variantId?: string; preselect?: string[] } = {},
): OptionSelection {
  const linked = variantId && product.variants.find((variant) => variant.id === variantId);
  if (linked) return { ...linked.options };

  let selection: OptionSelection = {};
  for (const option of product.options) {
    if (option.values.length === 1 && option.values[0]) selection = { ...selection, [option.title]: option.values[0].value };
  }
  for (const option of product.options) {
    if (!preselect.includes(option.title) || selection[option.title]) continue;
    const states = option.values.map(({ value }) => [value, optionValueState(product, selection, option.title, value)] as const);
    const value = (states.find(([, state]) => state === "available") ?? states.find(([, state]) => state !== "unavailable"))?.[0];
    if (value) selection = { ...selection, [option.title]: value };
  }
  return selection;
}

/**
 * Цена при текущем выборе: у выбранного варианта — его цена; иначе минимальная среди подходящих вариантов,
 * from — цены вариантов различаются («от 4 900 ₽»). Нет цен — undefined
 */
export function selectionPrice(product: ProductDetail, selection: OptionSelection): { price: ProductPrice; from: boolean } | undefined {
  const variant = findVariant(product, selection);
  if (variant) return variant.price && { price: variant.price, from: false };

  const prices = product.variants.flatMap((item) => (item.price && matchesSelection(item, selection) ? [item.price] : []));
  const [first, ...rest] = prices;
  if (!first) return undefined;
  const min = rest.reduce((lowest, price) => (price.amount < lowest.amount ? price : lowest), first);
  return { price: min, from: prices.some((price) => price.amount !== min.amount) };
}

/** Фото при текущем выборе: свои фото первого подходящего варианта (выбранного цвета), иначе фото товара */
export function selectionImages(product: ProductDetail, selection: OptionSelection): ProductImage[] {
  // Ничего не выбрано — общие фото товара, а не фото случайного варианта
  if (!Object.keys(selection).length && product.images.length) return product.images;
  const variant = product.variants.find((item) => item.images.length && matchesSelection(item, selection));
  return variant?.images ?? product.images;
}
