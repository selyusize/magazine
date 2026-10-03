import { optionValueState, type OptionSelection, type OptionValueState, type ProductDetail } from "@entities/product";
import type { ProductOptionConfig, ProductSizeGuide } from "@shared/config";

/** Значение опции для отображения */
export type PickerValue = {
  value: string;
  label: string;
  state: OptionValueState;
  /** CSS-цвет кружка (для type: color). Нет — серый кружок */
  swatch?: string;
};

/** Группа выбора одной опции: «Цвет: Бежевый» и её значения */
export type PickerGroup = {
  option: string;
  label: string;
  type: ProductOptionConfig["type"];
  /** Выбранное значение и его подпись */
  selected?: string;
  selectedLabel?: string;
  values: PickerValue[];
  guide?: ProductSizeGuide;
};

const swatchOf = (metadata: Record<string, unknown> | undefined) =>
  typeof metadata?.swatch === "string" ? metadata.swatch : undefined;

/**
 * Опции товара → группы выбора. Порядок и вид — из конфига, опции без записи — в конце кнопками.
 * Опция без записи с одним значением скрыта: выбирать нечего (Medusa заводит «Default option» у товара без опций).
 */
export function toPickerGroups(product: ProductDetail, selection: OptionSelection, configs: ProductOptionConfig[]): PickerGroup[] {
  const configured = new Map(configs.map((config, index) => [config.option, { config, index }]));
  const options = product.options
    .filter((option) => configured.has(option.title) || option.values.length > 1)
    .sort((a, b) => (configured.get(a.title)?.index ?? configs.length) - (configured.get(b.title)?.index ?? configs.length));

  return options.map((option) => {
    const config = configured.get(option.title)?.config;
    const label = (value: string) => config?.labels?.[value] ?? value;
    const selected = selection[option.title];

    return {
      option: option.title,
      label: config?.label ?? option.title,
      type: config?.type ?? "button",
      selected,
      selectedLabel: selected && label(selected),
      values: option.values.map(({ value, metadata }) => ({
        value,
        label: label(value),
        state: optionValueState(product, selection, option.title, value),
        swatch: config?.type === "color" ? (config.swatches?.[value] ?? swatchOf(metadata)) : undefined,
      })),
      guide: config?.guide,
    };
  });
}
