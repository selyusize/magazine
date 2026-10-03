/** Что знает корзина о товаре для расчёта доставки: вес в граммах, габариты в сантиметрах. */
export type ParcelItem = {
  quantity: number;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
};

/** Чем заменить пустые вес и габариты: у товаров поставщиков их часто нет. */
export type ParcelDefaults = {
  /** Вес одной единицы товара, г. */
  item_weight: number;
  /** Сторона коробки, если габаритов нет ни у одного товара, см. */
  box_side: number;
};

/** Одна посылка на корзину: перевозчику нужен вес и габариты места. */
export type Parcel = {
  /** г */
  weight: number;
  /** см */
  length: number;
  width: number;
  height: number;
};

/**
 * Вес — сумма по позициям (пустой вес позиции → `item_weight`). Габариты — грубая оценка: самая длинная и
 * самая широкая сторона среди товаров, высоты складываются (товары кладут друг на друга). Нет габаритов — куб `box_side`.
 */
export function toParcel(
  items: ParcelItem[],
  defaults: ParcelDefaults,
): Parcel {
  const positive = (value: number | null | undefined): number | null =>
    value && value > 0 ? value : null;

  const weight = items.reduce(
    (total, item) =>
      total +
      (positive(item.weight) ?? defaults.item_weight) *
        Math.max(1, item.quantity),
    0,
  );

  const sized = items.filter(
    (item) =>
      positive(item.length) && positive(item.width) && positive(item.height),
  );
  if (sized.length === 0) {
    return {
      weight,
      length: defaults.box_side,
      width: defaults.box_side,
      height: defaults.box_side,
    };
  }

  return {
    weight,
    length: Math.max(
      ...sized.map((item) => Math.max(item.length!, item.width!)),
    ),
    width: Math.max(
      ...sized.map((item) => Math.min(item.length!, item.width!)),
    ),
    height: sized.reduce(
      (total, item) => total + item.height! * Math.max(1, item.quantity),
      0,
    ),
  };
}
