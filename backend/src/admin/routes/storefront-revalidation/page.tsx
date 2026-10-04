import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ArrowPath } from "@medusajs/icons";
import { Button, Container, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ShopSwitcher } from "../../shops/components/shop-switcher";
import { RevalidationsTable } from "../../storefront-revalidation/components/revalidations-table";
import { WebhookCard } from "../../storefront-revalidation/components/webhook-card";
import { useStorefrontRevalidationPage } from "../../storefront-revalidation/hooks/use-storefront-revalidation-page";

/** Обновление витрины текущего магазина: вебхук ревалидации, его секрет и журнал отправок. */
const StorefrontRevalidationPage = () => {
  const { t } = useTranslation();
  const page = useStorefrontRevalidationPage();

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h1">{t("storefrontRevalidation.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("storefrontRevalidation.description")}
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-x-2">
          <ShopSwitcher />
          <Button size="small" isLoading={page.isRevalidating} onClick={page.revalidateAll}>
            {t("storefrontRevalidation.revalidateAll.action")}
          </Button>
        </div>
      </div>

      <WebhookCard
        webhook={page.webhook}
        isSecretVisible={page.isSecretVisible}
        onToggleSecret={page.toggleSecret}
        onCopy={page.copy}
        onRegenerate={page.regenerateSecret}
        isRegenerating={page.isRegenerating}
      />

      {page.journalError ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-error">
            {page.journalError.message}
          </Text>
        </div>
      ) : (
        <RevalidationsTable revalidations={page.revalidations} />
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Обновление витрины",
  icon: ArrowPath,
});

export default StorefrontRevalidationPage;
