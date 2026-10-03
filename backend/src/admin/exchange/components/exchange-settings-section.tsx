import { Button, Copy, Hint, Input, Label, Select, Switch, Text, Textarea } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { oneOf } from "../../lib/narrow";
import type { ExchangeSupplier } from "../hooks/exchange-api";
import { EXCHANGE_MODES } from "../hooks/exchange-settings-form";
import { useExchangeSettingsForm } from "../hooks/use-exchange-settings-form";

type TextField =
  | "login"
  | "password"
  | "url_login"
  | "url_password"
  | "pull_interval_minutes"
  | "purchase_price_type"
  | "retail_price_type"
  | "markup_percent"
  | "brand_property";

/** Настройки обмена поставщика: режим, доступы, типы цен, наценка, публикация. */
export function ExchangeSettingsSection({ supplier }: { supplier: ExchangeSupplier }) {
  const { t } = useTranslation();
  const settings = useExchangeSettingsForm(supplier);
  const { form, set } = settings;

  const input = (field: TextField, type: "text" | "password" | "number" = "text") => (
    <div className="flex flex-col gap-y-2">
      <Label htmlFor={`exchange-${field}`}>{t(`exchange.settings.fields.${field}`)}</Label>
      <Input
        id={`exchange-${field}`}
        type={type}
        value={form[field]}
        onChange={(event) => set(field, event.target.value)}
      />
      <Hint>{t(`exchange.settings.hints.${field}`)}</Hint>
    </div>
  );

  return (
    <form
      className="flex flex-col gap-y-6 px-6 py-4"
      onSubmit={(event) => {
        event.preventDefault();
        settings.submit();
      }}
    >
      <div className="flex max-w-sm flex-col gap-y-2">
        <Label htmlFor="exchange-mode">{t("exchange.settings.fields.mode")}</Label>
        <Select value={form.mode} onValueChange={(value) => set("mode", oneOf(value, EXCHANGE_MODES, "off"))}>
          <Select.Trigger id="exchange-mode">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {EXCHANGE_MODES.map((mode) => (
              <Select.Item key={mode} value={mode}>
                {t(`exchange.settings.modes.${mode}`)}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <Hint>{t(`exchange.settings.modeHints.${form.mode}`)}</Hint>
      </div>

      {form.mode === "push" && (
        <div className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <Label>{t("exchange.settings.url")}</Label>
            <div className="flex items-center gap-x-2">
              <Text size="small" className="bg-ui-bg-subtle rounded px-2 py-1 font-mono">
                {settings.url}
              </Text>
              <Copy content={settings.url} />
            </div>
            <Hint>{t("exchange.settings.urlHint")}</Hint>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {input("login")}
            {input("password", "password")}
          </div>
        </div>
      )}

      {form.mode === "pull" && (
        <div className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="exchange-urls">{t("exchange.settings.fields.urls")}</Label>
            <Textarea
              id="exchange-urls"
              rows={3}
              className="font-mono"
              value={form.urls}
              onChange={(event) => set("urls", event.target.value)}
              placeholder="https://supplier.ru/export/import.xml"
            />
            <Hint>{t("exchange.settings.hints.urls")}</Hint>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {input("url_login")}
            {input("url_password", "password")}
            {input("pull_interval_minutes", "number")}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {input("purchase_price_type")}
        {input("retail_price_type")}
        {input("markup_percent", "number")}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{input("brand_property")}</div>

      <div className="flex items-start gap-x-3">
        <Switch id="exchange-publish" checked={form.publish} onCheckedChange={(value) => set("publish", value)} />
        <div className="flex flex-col gap-y-1">
          <Label htmlFor="exchange-publish">{t("exchange.settings.fields.publish")}</Label>
          <Hint>{t("exchange.settings.hints.publish")}</Hint>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="small" type="submit" isLoading={settings.isSaving}>
          {t("crud.save")}
        </Button>
      </div>
    </form>
  );
}
