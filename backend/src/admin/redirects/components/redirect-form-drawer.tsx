import { Button, Drawer, Hint, Input, Label, Select, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import type { AdminRedirect } from "../hooks/redirects-api";
import { useRedirectForm } from "../hooks/use-redirect-form";

type RedirectFormDrawerProps = {
  /** `null` — новое правило. */
  redirect: AdminRedirect | null;
  onClose: () => void;
};

const CODES = ["301", "302", "410"] as const;

export function RedirectFormDrawer({
  redirect,
  onClose,
}: RedirectFormDrawerProps) {
  const { t } = useTranslation();
  const form = useRedirectForm(redirect, onClose);

  return (
    <Drawer open onOpenChange={(open) => !open && onClose()}>
      <Drawer.Content>
        <form
          onSubmit={form.submit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <Drawer.Header>
            <Drawer.Title>
              {t(
                redirect
                  ? "redirects.form.editTitle"
                  : "redirects.form.createTitle",
              )}
            </Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="redirect-from">
                {t("redirects.fields.from")}
              </Label>
              <Input
                id="redirect-from"
                value={form.fromPath}
                onChange={(event) => form.setFromPath(event.target.value)}
                placeholder="/products/old-handle"
                // Правило перезаписывается по «откуда» — поменять его можно только новым правилом
                disabled={redirect !== null}
                autoFocus
              />
              <Hint>{t("redirects.form.fromHint")}</Hint>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor="redirect-code">
                {t("redirects.fields.code")}
              </Label>
              <Select value={String(form.code)} onValueChange={form.setCode}>
                <Select.Trigger id="redirect-code">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {CODES.map((code) => (
                    <Select.Item key={code} value={code}>
                      {t(`redirects.codes.${code}`)}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            {!form.isGone && (
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="redirect-to">{t("redirects.fields.to")}</Label>
                <Input
                  id="redirect-to"
                  value={form.toPath}
                  onChange={(event) => form.setToPath(event.target.value)}
                  placeholder="/products/new-handle"
                />
                <Hint>{t("redirects.form.toHint")}</Hint>
              </div>
            )}

            {form.error && (
              <Text size="small" className="text-ui-fg-error">
                {form.error}
              </Text>
            )}
          </Drawer.Body>

          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary" size="small" type="button">
                {t("redirects.cancel")}
              </Button>
            </Drawer.Close>
            <Button
              size="small"
              type="submit"
              disabled={!form.canSubmit}
              isLoading={form.isSaving}
            >
              {t("redirects.form.save")}
            </Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  );
}
