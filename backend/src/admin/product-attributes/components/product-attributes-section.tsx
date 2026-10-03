import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Text,
} from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { useProductAttributesForm } from "../hooks/use-product-attributes-form";

/** В Select нельзя выбрать пустое значение — «не указано» кодируем отдельным ключом. */
const NONE = "__none";

/** Характеристики товара: таблица на карточке и фильтры каталога. */
export function ProductAttributesSection({ productId }: { productId: string }) {
  const { t } = useTranslation();
  const form = useProductAttributesForm(productId);

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h2">{t("productAttributes.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("productAttributes.description")}
          </Text>
        </div>
        <Button
          size="small"
          variant="secondary"
          onClick={form.submit}
          disabled={!form.canSave}
          isLoading={form.isSaving}
        >
          {t("productAttributes.save")}
        </Button>
      </div>

      {form.error ? (
        <Text className="text-ui-fg-error px-6 py-4">{form.error.message}</Text>
      ) : form.attributes.length === 0 ? (
        !form.isLoading && (
          <Text size="small" className="text-ui-fg-subtle px-6 py-4">
            {t("productAttributes.empty")}
          </Text>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
          {form.attributes.map((attribute) => {
            const id = `product-attribute-${attribute.id}`;
            const value = form.form[attribute.id] ?? "";
            return (
              <div key={attribute.id} className="flex flex-col gap-y-2">
                <Label htmlFor={id}>
                  {attribute.unit
                    ? `${attribute.name}, ${attribute.unit}`
                    : attribute.name}
                </Label>
                {attribute.type === "boolean" ? (
                  <Select
                    value={value || NONE}
                    onValueChange={(next) =>
                      form.setValue(attribute.id, next === NONE ? "" : next)
                    }
                  >
                    <Select.Trigger id={id}>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value={NONE}>
                        {t("productAttributes.none")}
                      </Select.Item>
                      <Select.Item value="true">{t("crud.yes")}</Select.Item>
                      <Select.Item value="false">{t("crud.no")}</Select.Item>
                    </Select.Content>
                  </Select>
                ) : (
                  <Input
                    id={id}
                    size="small"
                    inputMode={
                      attribute.type === "number" ? "decimal" : undefined
                    }
                    placeholder={
                      attribute.type === "string"
                        ? t("productAttributes.multipleHint")
                        : undefined
                    }
                    value={value}
                    onChange={(event) =>
                      form.setValue(attribute.id, event.target.value)
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
