"use client";

import { useId } from "react";

import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@shared/ui/field";
import { Icon } from "@shared/ui/icon";
import { RadioGroup, RadioGroupItem } from "@shared/ui/radio-group";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@shared/ui/sheet";
import { Slider } from "@shared/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@shared/ui/toggle-group";

import type { FilterOption } from "../model/filters";
import type { CatalogFilterState, FilterListSectionView, FilterRangeSectionView } from "../model/use-catalog-filter";

export type CatalogFilterContent = {
  /** Подпись кнопки и заголовок шторки: «Фильтры» */
  label: string;
  applyLabel: string;
  resetLabel: string;
  className?: string;
};

export type CatalogFilterViewProps = CatalogFilterContent & CatalogFilterState;

type ListSectionProps = {
  section: FilterListSectionView;
  onValuesChange: CatalogFilterState["onValuesChange"];
};

/** «Хлопок (4)» — подпись значения со счётчиком, как в макете */
const optionText = (option: FilterOption) => `${option.label} (${option.count})`;

/** Строка списка: 30px, текст приглушённый, выбранный — основным цветом */
const rowClass = "h-7.5 gap-2.5";
const rowLabelClass = "text-300 font-normal text-muted-foreground peer-data-[state=checked]:text-foreground";

/** Кружки цветов 26px: выбранный — в тонком кольце. Можно выбрать несколько */
function ColorSection({ section, onValuesChange }: ListSectionProps) {
  return (
    <ToggleGroup
      type="multiple"
      spacing={5.5}
      value={section.selected}
      onValueChange={(values) => onValuesChange(section.key, values)}
      className="flex-wrap"
    >
      {section.options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={optionText(option)}
          title={optionText(option)}
          className="size-6.5 min-w-0 rounded-full p-0 ring-foreground ring-offset-3 ring-offset-background hover:bg-transparent aria-pressed:bg-transparent data-[state=on]:bg-transparent data-[state=on]:ring-1"
        >
          <span
            className={cn("size-full rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]", !option.color && "bg-muted")}
            style={option.color ? { backgroundColor: option.color } : undefined}
          />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Список с флажками: несколько значений */
function CheckboxSection({ section, onValuesChange }: ListSectionProps) {
  const id = useId();
  const toggle = (value: string, checked: boolean) =>
    onValuesChange(section.key, checked ? [...section.selected, value] : section.selected.filter((item) => item !== value));

  return (
    <FieldGroup className="gap-0">
      {section.options.map((option, index) => (
        <Field key={option.value} orientation="horizontal" className={rowClass}>
          <Checkbox
            id={`${id}-${index}`}
            checked={section.selected.includes(option.value)}
            onCheckedChange={(checked) => toggle(option.value, checked === true)}
          />
          <FieldLabel htmlFor={`${id}-${index}`} className={rowLabelClass}>
            {optionText(option)}
          </FieldLabel>
        </Field>
      ))}
    </FieldGroup>
  );
}

/** Список с переключателями: одно значение. Снять — кнопкой «Сбросить» */
function RadioSection({ section, onValuesChange }: ListSectionProps) {
  const id = useId();

  return (
    <RadioGroup value={section.selected[0] ?? ""} onValueChange={(value) => onValuesChange(section.key, [value])} className="gap-0">
      {section.options.map((option, index) => (
        <Field key={option.value} orientation="horizontal" className={rowClass}>
          <RadioGroupItem id={`${id}-${index}`} value={option.value} />
          <FieldLabel htmlFor={`${id}-${index}`} className={rowLabelClass}>
            {optionText(option)}
          </FieldLabel>
        </Field>
      ))}
    </RadioGroup>
  );
}

/** Слайдер «от — до» и подписи границ под ним */
function RangeSection({ section, onRangeChange }: { section: FilterRangeSectionView } & Pick<CatalogFilterState, "onRangeChange">) {
  return (
    <div className="flex flex-col gap-4 px-1.5">
      <Slider
        min={section.min}
        max={section.max}
        step={section.step}
        minStepsBetweenThumbs={1}
        value={section.value}
        onValueChange={(value) => onRangeChange(section.key, [value[0] ?? section.min, value[1] ?? section.max])}
        aria-label={section.label}
      />
      <div className="flex justify-between text-300 text-muted-foreground">
        <span>от {section.valueLabels[0]}</span>
        <span>до {section.valueLabels[1]}</span>
      </div>
    </div>
  );
}

/**
 * Фильтры каталога (Figma: Filters): кнопка в шапке каталога и шторка справа — на мобильных во всю ширину,
 * с sm — 400px. Секция по типу фильтра: кружки цветов, флажки, переключатели или слайдер.
 * Выбор применяется кнопкой внизу.
 */
export function CatalogFilterView({
  label,
  applyLabel,
  resetLabel,
  className,
  open,
  onOpenChange,
  sections,
  activeCount,
  canReset,
  onValuesChange,
  onRangeChange,
  onReset,
  onApply,
}: CatalogFilterViewProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="bare" size="bare" className={cn("text-300", className)}>
          {activeCount ? `${label} (${activeCount})` : label}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-describedby={undefined}
        className="w-full gap-0 border-l-0 shadow-none data-[side=right]:w-full data-[side=right]:sm:max-w-100"
      >
        <SheetHeader className="relative h-17 shrink-0 justify-center border-b border-border p-0">
          <SheetTitle className="text-center text-600 font-normal">{label}</SheetTitle>
          {canReset ? (
            <Button
              variant="bare"
              size="bare"
              onClick={onReset}
              className="absolute start-7.5 top-1/2 -translate-y-1/2 text-300 text-muted-foreground hover:text-foreground"
            >
              {resetLabel}
            </Button>
          ) : null}
          <SheetClose asChild>
            <Button
              variant="bare"
              size="bare"
              aria-label="Закрыть"
              className="absolute end-7.5 top-1/2 -translate-y-1/2 after:absolute after:-inset-2"
            >
              <Icon name="close" className="size-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-11 overflow-y-auto px-7.5 py-9">
          {sections.map((section) => (
            <FieldSet key={section.key} className="gap-0">
              <FieldLegend className="mb-6 text-300 font-normal">{section.label}</FieldLegend>
              {section.type === "color" ? <ColorSection section={section} onValuesChange={onValuesChange} /> : null}
              {section.type === "checkbox" ? <CheckboxSection section={section} onValuesChange={onValuesChange} /> : null}
              {section.type === "radio" ? <RadioSection section={section} onValuesChange={onValuesChange} /> : null}
              {section.type === "range" ? <RangeSection section={section} onRangeChange={onRangeChange} /> : null}
            </FieldSet>
          ))}
        </div>

        <SheetFooter className="mt-0 shrink-0 border-t border-border px-7.5 pt-6 pb-6">
          <Button size="xl" onClick={onApply} className="h-17 w-full rounded-none">
            {applyLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
