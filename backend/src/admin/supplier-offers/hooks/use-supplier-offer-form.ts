import { toast } from "@medusajs/ui";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import {
  useSaveSupplierOffer,
  useSupplierOptions,
  type ProductSupplierOffer,
} from "./supplier-offers-api";

const textOrNull = (value: string): string | null => value.trim() || null;

/**
 * Форма предложения. Поставщик и вариант выбираются только при создании — потом их не меняют (остаток остался бы
 * на чужом складе). Ошибки бэкенда (повтор Ид у поставщика) — под формой.
 */
export function useSupplierOfferForm(
  productId: string,
  offer: ProductSupplierOffer | null,
  onSaved: () => void,
) {
  const { t } = useTranslation();
  const save = useSaveSupplierOffer(productId);
  const suppliers = useSupplierOptions(productId, offer === null);

  const [supplierId, setSupplierId] = useState(offer?.supplier_id ?? "");
  const [variantId, setVariantId] = useState(offer?.variant_id ?? "");
  const [externalId, setExternalId] = useState(offer?.external_id ?? "");
  const [sku, setSku] = useState(offer?.sku ?? "");
  const [barcode, setBarcode] = useState(offer?.barcode ?? "");
  const [purchasePrice, setPurchasePrice] = useState(
    offer?.purchase_price === null || offer?.purchase_price === undefined
      ? ""
      : String(offer.purchase_price),
  );
  const [quantity, setQuantity] = useState(String(offer?.quantity ?? 0));

  const canSubmit =
    supplierId !== "" &&
    variantId !== "" &&
    externalId.trim() !== "" &&
    quantity.trim() !== "" &&
    !save.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const fields = {
      external_id: externalId.trim(),
      sku: textOrNull(sku),
      barcode: textOrNull(barcode),
      purchase_price:
        purchasePrice.trim() === "" ? null : Number(purchasePrice),
      quantity: Number(quantity),
    };
    save.mutate(
      offer
        ? { id: offer.id, fields }
        : { id: null, supplier_id: supplierId, variant_id: variantId, fields },
      {
        onSuccess: () => {
          toast.success(t("supplierOffers.form.saved"));
          onSaved();
        },
      },
    );
  };

  return {
    isNew: offer === null,
    suppliers: suppliers.data ?? [],
    supplierId,
    setSupplierId,
    variantId,
    setVariantId,
    externalId,
    setExternalId,
    sku,
    setSku,
    barcode,
    setBarcode,
    purchasePrice,
    setPurchasePrice,
    quantity,
    setQuantity,
    canSubmit,
    isSaving: save.isPending,
    error: save.error?.message ?? null,
    submit,
  };
}
