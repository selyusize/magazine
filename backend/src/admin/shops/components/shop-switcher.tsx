import { Select, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { useShopSwitcher } from "../hooks/use-shop-switcher";

/** Текущий магазин админки — в шапке своих страниц; разделы магазина показывают его данные. */
export function ShopSwitcher() {
  const { t } = useTranslation();
  const { options, current, isLoading, select } = useShopSwitcher();

  if (isLoading || !current) return null;

  return (
    <div className="flex items-center gap-x-2">
      <Text size="small" className="text-ui-fg-subtle">
        {t("shopSwitcher.label")}
      </Text>
      <Select size="small" value={current.id} onValueChange={select}>
        <Select.Trigger
          className="min-w-[180px]"
          aria-label={t("shopSwitcher.label")}
        >
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          {options.map((shop) => (
            <Select.Item key={shop.id} value={shop.id}>
              {shop.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  );
}
