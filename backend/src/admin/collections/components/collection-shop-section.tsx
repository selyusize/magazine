import { Button, Container, Heading, Hint, Select, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { useCollectionShop } from "../hooks/use-collection-shop";

/** Магазин коллекции: без него коллекция не видна ни одной витрине. Выбирается один раз. */
export function CollectionShopSection({ collectionId }: { collectionId: string }) {
  const { t } = useTranslation();
  const page = useCollectionShop(collectionId);

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">{t("collectionShop.title")}</Heading>
      </div>

      {page.error ? (
        <Text className="text-ui-fg-error px-6 py-4">{page.error.message}</Text>
      ) : page.isLoading ? null : page.shop ? (
        <div className="flex flex-col gap-y-1 px-6 py-4">
          <Text weight="plus">{page.shop.name}</Text>
          <Hint>{t("collectionShop.fixed")}</Hint>
        </div>
      ) : (
        <div className="flex flex-col gap-y-3 px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            {t("collectionShop.missing")}
          </Text>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-64">
              <Select value={page.shopId} onValueChange={page.setShopId}>
                <Select.Trigger>
                  <Select.Value placeholder={t("collectionShop.select")} />
                </Select.Trigger>
                <Select.Content>
                  {page.options.map((shop) => (
                    <Select.Item key={shop.id} value={shop.id}>
                      {shop.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <Button size="small" disabled={!page.shopId} isLoading={page.isSaving} onClick={page.submit}>
              {t("collectionShop.assign")}
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}
