import { toast, usePrompt } from "@medusajs/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useDeleteSupplierOffer,
  useProductSupplierOffers,
  type ProductSupplierOffer,
} from "./supplier-offers-api";

/** Блок «Поставщики» карточки товара: список предложений, шторка формы, удаление с подтверждением. */
export function useSupplierOffersSection(productId: string) {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const offers = useProductSupplierOffers(productId);
  const remove = useDeleteSupplierOffer(productId);
  const [editing, setEditing] = useState<ProductSupplierOffer | "new" | null>(
    null,
  );

  const confirmRemove = async (offer: ProductSupplierOffer) => {
    const confirmed = await prompt({
      title: t("supplierOffers.delete.title"),
      description: t("supplierOffers.delete.description", {
        supplier: offer.supplier_name,
        variant: offer.variant_title,
      }),
      confirmText: t("supplierOffers.delete.confirm"),
      cancelText: t("crud.cancel"),
    });
    if (!confirmed) return;

    remove.mutate(offer.id, {
      onSuccess: () => toast.success(t("supplierOffers.delete.done")),
      onError: (error) => toast.error(error.message),
    });
  };

  const rows = offers.data ?? [];
  return {
    rows,
    isLoading: offers.isLoading,
    error: offers.error,
    /** Сколько продаём: остатки активных поставщиков (так же считает склад). */
    totalQuantity: rows
      .filter((offer) => offer.supplier_is_active)
      .reduce((sum, offer) => sum + offer.quantity, 0),
    editing,
    openNew: () => setEditing("new"),
    openEdit: (offer: ProductSupplierOffer) => setEditing(offer),
    closeEditor: () => setEditing(null),
    remove: confirmRemove,
  };
}
