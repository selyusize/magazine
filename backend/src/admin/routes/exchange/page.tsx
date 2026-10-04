import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ArrowDownTray } from "@medusajs/icons";
import { Container, Heading, Select, Tabs, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ExchangeSettingsSection } from "../../exchange/components/exchange-settings-section";
import {
  Empty,
  GroupMappingSection,
} from "../../exchange/components/group-mapping-section";
import { ImportRunsSection } from "../../exchange/components/import-runs-section";
import { PropertyMappingSection } from "../../exchange/components/property-mapping-section";
import { ReviewSection } from "../../exchange/components/review-section";
import {
  EXCHANGE_TABS,
  useExchangePage,
} from "../../exchange/hooks/use-exchange-page";
import { ShopSwitcher } from "../../shops/components/shop-switcher";

/**
 * Импорт CommerceML текущего магазина: настройки обмена поставщика, история запусков, маппинг групп и свойств,
 * очередь разбора.
 */
const ExchangePage = () => {
  const { t } = useTranslation();
  const page = useExchangePage();
  const supplier = page.supplier;

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h1">{t("exchange.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("exchange.description")}
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ShopSwitcher />
          {page.suppliers.length > 0 && (
            <div className="w-64">
              <Select value={supplier?.id} onValueChange={page.setSupplierId}>
                <Select.Trigger>
                  <Select.Value placeholder={t("exchange.selectSupplier")} />
                </Select.Trigger>
                <Select.Content>
                  {page.suppliers.map((item) => (
                    <Select.Item key={item.id} value={item.id}>
                      {item.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          )}
        </div>
      </div>

      {page.error ? (
        <Text className="text-ui-fg-error px-6 py-4">{page.error.message}</Text>
      ) : page.isLoading ? null : !supplier ? (
        <Empty i18n="exchange" />
      ) : (
        <Tabs value={page.tab} onValueChange={page.setTab}>
          <div className="px-6 pt-4">
            <Tabs.List>
              {EXCHANGE_TABS.map((tab) => (
                <Tabs.Trigger key={tab} value={tab}>
                  {t(`exchange.tabs.${tab}`)}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </div>
          <Tabs.Content value="settings">
            <ExchangeSettingsSection supplier={supplier} />
          </Tabs.Content>
          <Tabs.Content value="runs">
            <ImportRunsSection supplier={supplier} />
          </Tabs.Content>
          <Tabs.Content value="groups">
            <GroupMappingSection supplierId={supplier.id} />
          </Tabs.Content>
          <Tabs.Content value="properties">
            <PropertyMappingSection supplierId={supplier.id} />
          </Tabs.Content>
          <Tabs.Content value="review">
            <ReviewSection supplierId={supplier.id} />
          </Tabs.Content>
        </Tabs>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Импорт",
  icon: ArrowDownTray,
});

export default ExchangePage;
