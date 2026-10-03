"use client";

import { useId } from "react";

import { cn } from "@shared/lib/utils";
import { NativeSelect, NativeSelectOption } from "@shared/ui/native-select";
import { ToggleGroup, ToggleGroupItem } from "@shared/ui/toggle-group";

import type { PickerGroup, PickerValue } from "../model/groups";
import { SizeGuide } from "./size-guide";

export type VariantPickerViewProps = {
  groups: PickerGroup[];
  onSelect: (option: string, value: string) => void;
  /** Приписка к значению, которого нет в наличии: «нет в наличии» */
  soldOutLabel?: string;
  className?: string;
};

type GroupProps = { group: PickerGroup; labelId: string; onSelect: VariantPickerViewProps["onSelect"]; soldOutLabel: string };

/** Подпись значения для скринридера и всплывающей подсказки: «Чёрный — нет в наличии» */
const valueTitle = (value: PickerValue, soldOutLabel: string) =>
  value.state === "soldout" ? `${value.label} — ${soldOutLabel}` : value.label;

/**
 * Значения, которых нет в наличии, можно выбрать — покупатель увидит «Нет в наличии» на кнопке, а не молчаливый
 * запрет. Несуществующие сочетания недоступны
 */
const soldOutClass = "data-[soldout]:text-muted-foreground data-[soldout]:line-through";

/** Кружки цветов 26px: выбранный — в тонком кольце, закончившийся — перечёркнут */
function ColorGroup({ group, labelId, onSelect, soldOutLabel }: GroupProps) {
  return (
    <ToggleGroup
      type="single"
      spacing={5.5}
      value={group.selected ?? ""}
      onValueChange={(value) => value && onSelect(group.option, value)}
      aria-labelledby={labelId}
      className="flex-wrap"
    >
      {group.values.map((value) => (
        <ToggleGroupItem
          key={value.value}
          value={value.value}
          disabled={value.state === "unavailable"}
          data-soldout={value.state === "soldout" ? "" : undefined}
          aria-label={valueTitle(value, soldOutLabel)}
          title={valueTitle(value, soldOutLabel)}
          className={cn(
            "relative size-6.5 min-w-0 rounded-full p-0 ring-foreground ring-offset-3 ring-offset-background hover:bg-transparent aria-pressed:bg-transparent data-[state=on]:bg-transparent data-[state=on]:ring-1",
            // Закончившийся цвет — диагональ поверх кружка
            "data-[soldout]:after:absolute data-[soldout]:after:inset-x-0 data-[soldout]:after:top-1/2 data-[soldout]:after:h-px data-[soldout]:after:-rotate-45 data-[soldout]:after:bg-foreground",
          )}
        >
          <span
            className={cn("size-full rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]", !value.swatch && "bg-muted")}
            style={value.swatch ? { backgroundColor: value.swatch } : undefined}
          />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Квадратные кнопки со значением (размеры): выбранная — в чёрной рамке */
function ButtonGroup({ group, labelId, onSelect, soldOutLabel }: GroupProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={5}
      value={group.selected ?? ""}
      onValueChange={(value) => value && onSelect(group.option, value)}
      aria-labelledby={labelId}
      className="flex-wrap"
    >
      {group.values.map((value) => (
        <ToggleGroupItem
          key={value.value}
          value={value.value}
          disabled={value.state === "unavailable"}
          data-soldout={value.state === "soldout" ? "" : undefined}
          aria-label={value.state === "soldout" ? valueTitle(value, soldOutLabel) : undefined}
          title={valueTitle(value, soldOutLabel)}
          className={cn(
            "h-8 min-w-8 rounded-none border-border px-2 text-300 font-normal hover:border-foreground hover:bg-transparent aria-pressed:bg-transparent data-[state=on]:border-foreground data-[state=on]:bg-transparent",
            soldOutClass,
          )}
        >
          {value.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Выпадающий список: когда значений много (длина, номер кольца) */
function SelectGroup({ group, labelId, onSelect, soldOutLabel }: GroupProps) {
  return (
    <NativeSelect
      aria-labelledby={labelId}
      value={group.selected ?? ""}
      onChange={(event) => event.target.value && onSelect(group.option, event.target.value)}
      className="w-full"
    >
      <NativeSelectOption value="" disabled>
        {group.label}
      </NativeSelectOption>
      {group.values.map((value) => (
        <NativeSelectOption key={value.value} value={value.value} disabled={value.state === "unavailable"}>
          {valueTitle(value, soldOutLabel)}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

const groupViews = { color: ColorGroup, button: ButtonGroup, select: SelectGroup };

function Group(props: Omit<GroupProps, "labelId">) {
  const labelId = useId();
  const { group } = props;
  const View = groupViews[group.type];

  return (
    <div data-slot="variant-picker-group" data-option={group.option} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <p id={labelId} className="text-300">
          {group.label}
          {group.selectedLabel ? <span className="text-muted-foreground">: {group.selectedLabel}</span> : null}
        </p>
        {group.guide ? <SizeGuide guide={group.guide} /> : null}
      </div>
      <View {...props} labelId={labelId} />
    </div>
  );
}

/**
 * Выбор варианта товара (Figma: Product detail — Product Color, Product Size). Вид группы — по конфигу опции:
 * кружки цветов, кнопки или выпадающий список. Состояние выбора — снаружи (useVariantSelection).
 */
export function VariantPickerView({ groups, onSelect, soldOutLabel = "нет в наличии", className }: VariantPickerViewProps) {
  if (!groups.length) return null;

  return (
    <div data-slot="variant-picker" className={cn("flex flex-col gap-6", className)}>
      {groups.map((group) => (
        <Group key={group.option} group={group} onSelect={onSelect} soldOutLabel={soldOutLabel} />
      ))}
    </div>
  );
}
