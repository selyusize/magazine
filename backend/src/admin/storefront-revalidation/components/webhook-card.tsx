import { Button, Code, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import type { StorefrontWebhook } from "../hooks/revalidation-api";

type WebhookCardProps = {
  webhook: StorefrontWebhook | null;
  isSecretVisible: boolean;
  onToggleSecret: () => void;
  onCopy: (value: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
};

const MASK = "•".repeat(24);

/** Адрес вебхука и секрет магазина — для env фронта (`REVALIDATE_SECRET`) и vault Ansible. */
export function WebhookCard(props: WebhookCardProps) {
  const { t } = useTranslation();
  const secret = props.webhook?.revalidate_secret ?? null;

  return (
    <div className="flex flex-col gap-y-3 px-6 py-4">
      <div className="grid grid-cols-[160px_1fr] items-center gap-x-4 gap-y-3">
        <Text size="small" weight="plus">
          {t("storefrontRevalidation.webhook.url")}
        </Text>
        <Code className="w-fit">{props.webhook?.revalidate_url ?? "—"}</Code>

        <Text size="small" weight="plus">
          {t("storefrontRevalidation.webhook.secret")}
        </Text>
        <div className="flex flex-wrap items-center gap-2">
          {secret === null ? (
            <Text size="small" className="text-ui-fg-error">
              {t("storefrontRevalidation.webhook.unreadable")}
            </Text>
          ) : (
            <>
              <Code>{props.isSecretVisible ? secret : MASK}</Code>
              <Button variant="transparent" size="small" onClick={props.onToggleSecret}>
                {props.isSecretVisible
                  ? t("storefrontRevalidation.webhook.hide")
                  : t("storefrontRevalidation.webhook.show")}
              </Button>
              <Button variant="transparent" size="small" onClick={() => props.onCopy(secret)}>
                {t("storefrontRevalidation.webhook.copy")}
              </Button>
            </>
          )}
          <Button
            variant="secondary"
            size="small"
            isLoading={props.isRegenerating}
            onClick={props.onRegenerate}
          >
            {t("storefrontRevalidation.regenerate.action")}
          </Button>
        </div>
      </div>
      <Text size="small" className="text-ui-fg-subtle">
        {t("storefrontRevalidation.webhook.hint")}
      </Text>
    </div>
  );
}
