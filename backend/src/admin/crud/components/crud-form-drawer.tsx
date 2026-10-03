import { Button, Drawer, Hint, Label, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { useCRUDForm } from "../hooks/use-crud-form";
import type { CRUDResource, CRUDRow } from "../types";
import { CRUDFieldInput } from "./crud-field-input";

type CRUDFormDrawerProps = {
  resource: CRUDResource;
  /** `null` — новая запись. */
  row: CRUDRow | null;
  onClose: () => void;
};

/** Форма записи в шторке: поля из описания ресурса, подсказки — `{i18n}.hints.{поле}`. */
export function CRUDFormDrawer({
  resource,
  row,
  onClose,
}: CRUDFormDrawerProps) {
  const { t, i18n } = useTranslation();
  const form = useCRUDForm(resource, row, onClose);

  return (
    <Drawer open onOpenChange={(open) => !open && onClose()}>
      <Drawer.Content>
        <form
          onSubmit={form.submit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <Drawer.Header>
            <Drawer.Title>
              {t(`${resource.i18n}.${row ? "editTitle" : "createTitle"}`)}
            </Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
            {resource.fields.map((field) => {
              const id = `crud-${field.name}`;
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
                    value={form.values[field.name]}
                    categories={form.categories}
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
          </Drawer.Body>

          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary" size="small" type="button">
                {t("crud.cancel")}
              </Button>
            </Drawer.Close>
            <Button
              size="small"
              type="submit"
              disabled={!form.canSubmit}
              isLoading={form.isSaving}
            >
              {t("crud.save")}
            </Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  );
}
