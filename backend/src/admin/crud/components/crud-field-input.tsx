import { Input, Select, Switch, Textarea } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import type { FormValue } from "../hooks/form-values";
import type { CRUDField } from "../types";

type CRUDFieldInputProps = {
  i18n: string;
  field: CRUDField;
  id: string;
  value: FormValue;
  categories: { id: string; name: string }[];
  /** Поле `createOnly` в форме изменения. */
  disabled?: boolean;
  onChange: (value: FormValue) => void;
};

/** Контрол поля по его типу. */
export function CRUDFieldInput({
  i18n,
  field,
  id,
  value,
  categories,
  disabled,
  onChange,
}: CRUDFieldInputProps) {
  const { t } = useTranslation();

  switch (field.type) {
    case "boolean":
      return (
        <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />
      );
    case "textarea":
    case "json":
      return (
        <Textarea
          id={id}
          rows={field.type === "json" ? 6 : (field.rows ?? 4)}
          className={field.type === "json" ? "font-mono" : undefined}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            field.type === "json" ? '{ "brand": ["nike"] }' : undefined
          }
        />
      );
    case "number":
      return (
        <Input
          id={id}
          type="number"
          step={1}
          min={field.min}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "select":
      return (
        <Select value={String(value)} onValueChange={onChange}>
          <Select.Trigger id={id}>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {field.options.map((option) => (
              <Select.Item key={option} value={option}>
                {t(`${i18n}.options.${field.name}.${option}`)}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      );
    case "readonly":
      return (
        <Input id={id} value={String(value)} readOnly className="font-mono" />
      );
    case "category":
      return (
        <Select value={String(value) || undefined} onValueChange={onChange}>
          <Select.Trigger id={id}>
            <Select.Value placeholder={t("crud.selectCategory")} />
          </Select.Trigger>
          <Select.Content>
            {categories.map((category) => (
              <Select.Item key={category.id} value={category.id}>
                {category.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      );
    default:
      return (
        <Input
          id={id}
          value={String(value)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
        />
      );
  }
}
