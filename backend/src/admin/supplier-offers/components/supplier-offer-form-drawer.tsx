import { Button, Drawer, Hint, Input, Label, Select, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import type { ProductSupplierOffer } from "../hooks/supplier-offers-api";
import { useSupplierOfferForm } from "../hooks/use-supplier-offer-form";

type SupplierOfferFormDrawerProps = {
  productId: string;
  variants: { id: string; title: string }[];
  /** `null` — новое предложение. */
  offer: ProductSupplierOffer | null;
  onClose: () => void;
};

export function SupplierOfferFormDrawer({
  productId,
  variants,
  offer,
  onClose,
}: SupplierOfferFormDrawerProps) {
  const { t } = useTranslation();
  const form = useSupplierOfferForm(productId, offer, onClose);

  const text = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    props: { type?: string; placeholder?: string; hint?: string } = {},
  ) => (
    <div className="flex flex-col gap-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={props.type}
        min={props.type === "number" ? 0 : undefined}
        value={value}
        placeholder={props.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {props.hint && <Hint>{props.hint}</Hint>}
    </div>
  );

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
                form.isNew
                  ? "supplierOffers.form.createTitle"
                  : "supplierOffers.form.editTitle",
              )}
            </Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="offer-supplier">
                {t("supplierOffers.fields.supplier")}
              </Label>
              <Select
                value={form.supplierId || undefined}
                onValueChange={form.setSupplierId}
                disabled={!form.isNew}
              >
                <Select.Trigger id="offer-supplier">
                  <Select.Value
                    placeholder={
                      offer?.supplier_name ??
                      t("supplierOffers.form.selectSupplier")
                    }
                  />
                </Select.Trigger>
                <Select.Content>
                  {form.suppliers.map((supplier) => (
                    <Select.Item key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor="offer-variant">
                {t("supplierOffers.fields.variant")}
              </Label>
              <Select
                value={form.variantId || undefined}
                onValueChange={form.setVariantId}
                disabled={!form.isNew}
              >
                <Select.Trigger id="offer-variant">
                  <Select.Value
                    placeholder={t("supplierOffers.form.selectVariant")}
                  />
                </Select.Trigger>
                <Select.Content>
                  {variants.map((variant) => (
                    <Select.Item key={variant.id} value={variant.id}>
                      {variant.title}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              {form.isNew && <Hint>{t("supplierOffers.form.fixedHint")}</Hint>}
            </div>

            {text(
              "offer-external-id",
              t("supplierOffers.fields.external_id"),
              form.externalId,
              form.setExternalId,
              {
                placeholder: "bd72d910-…#c1f4…",
                hint: t("supplierOffers.form.externalIdHint"),
              },
            )}
            {text(
              "offer-sku",
              t("supplierOffers.fields.sku"),
              form.sku,
              form.setSku,
            )}
            {text(
              "offer-barcode",
              t("supplierOffers.fields.barcode"),
              form.barcode,
              form.setBarcode,
            )}
            {text(
              "offer-price",
              t("supplierOffers.fields.purchase_price"),
              form.purchasePrice,
              form.setPurchasePrice,
              { type: "number" },
            )}
            {text(
              "offer-quantity",
              t("supplierOffers.fields.quantity"),
              form.quantity,
              form.setQuantity,
              { type: "number", hint: t("supplierOffers.form.quantityHint") },
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
