import { Button, Container, Heading, Hint, Label, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { useSettingsForm } from "../hooks/use-settings-form";
import type { SettingsResource } from "../types";
import { CRUDFieldInput } from "./crud-field-input";

/** Страница настроек-синглтона целиком: заголовок и форма по описанию ресурса. Страница в `routes/` — одна строка. */
export function SettingsPage({ resource }: { resource: SettingsResource }) {
  const { t, i18n } = useTranslation();
  const form = useSettingsForm(resource);

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">{t(`${resource.i18n}.title`)}</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {t(`${resource.i18n}.description`)}
        </Text>
      </div>

      {form.loadError && (
        <Text className="text-ui-fg-error px-6 py-4">{form.loadError}</Text>
      )}

      {form.values && (
        <form
          onSubmit={form.submit}
          className="flex max-w-2xl flex-col gap-y-6 px-6 py-6"
        >
          {resource.fields.map((field) => {
            const id = `settings-${field.name}`;
            const hintKey = `${resource.i18n}.hints.${field.name}`;
            return (
              <div key={field.name} className="flex flex-col gap-y-2">
                <Label htmlFor={id}>
                  {t(`${resource.i18n}.fields.${field.name}`)}
                </Label>
                <CRUDFieldInput
                  i18n={resource.i18n}
                  field={field}
                  id={id}
                  value={form.values?.[field.name] ?? ""}
                  categories={[]}
                  onChange={(value) => form.setValue(field.name, value)}
                />
                {i18n.exists(hintKey) && <Hint>{t(hintKey)}</Hint>}
              </div>
            );
          })}

          {form.error && (
            <Text size="small" className="text-ui-fg-error">
              {form.error}
            </Text>
          )}

          <div>
            <Button
              size="small"
              type="submit"
              disabled={!form.canSubmit}
              isLoading={form.isSaving}
            >
              {t("crud.save")}
            </Button>
          </div>
        </form>
      )}
    </Container>
  );
}
