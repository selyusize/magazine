import {
  Button,
  Container,
  Heading,
  Hint,
  Label,
  Select,
  Text,
} from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { NONE, useProductCatalogForm } from "../hooks/use-product-catalog-form";

/** Бренд и основная категория товара (от неё крошки и canonical). */
export function ProductCatalogSection({ productId }: { productId: string }) {
  const { t } = useTranslation();
  const form = useProductCatalogForm(productId);

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">{t("productCatalog.title")}</Heading>
      </div>

      {form.error ? (
        <Text className="text-ui-fg-error px-6 py-4">{form.error.message}</Text>
      ) : (
        <div className="flex flex-col gap-y-4 px-6 py-4">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="product-catalog-brand">
              {t("productCatalog.brand")}
            </Label>
            <Select value={form.brandId} onValueChange={form.setBrandId}>
              <Select.Trigger id="product-catalog-brand">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value={NONE}>
                  {t("productCatalog.none")}
                </Select.Item>
                {form.brands.map((brand) => (
                  <Select.Item key={brand.id} value={brand.id}>
                    {brand.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="product-catalog-main-category">
              {t("productCatalog.mainCategory")}
            </Label>
            <Select
              value={form.mainCategoryId}
              onValueChange={form.setMainCategoryId}
            >
              <Select.Trigger id="product-catalog-main-category">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value={NONE}>
                  {t("productCatalog.none")}
                </Select.Item>
                {form.categories.map((category) => (
                  <Select.Item key={category.id} value={category.id}>
                    {category.name}
                    {form.productCategoryIds.has(category.id) &&
                      ` · ${t("productCatalog.ofProduct")}`}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
            <Hint>{t("productCatalog.mainCategoryHint")}</Hint>
          </div>

          <div className="flex justify-end">
            <Button
              size="small"
              onClick={form.submit}
              disabled={!form.canSave}
              isLoading={form.isSaving}
            >
              {t("productCatalog.save")}
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}
