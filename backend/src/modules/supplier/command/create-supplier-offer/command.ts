/** Предложение поставщика по варианту — вручную из админки или импортом (этап 4). */
export type CreateSupplierOfferCommand = {
  supplier_id: string;
  variant_id: string;
  external_id: string;
  sku?: string | null;
  barcode?: string | null;
  purchase_price?: number | null;
  quantity?: number;
  /** ISO-строка. */
  synced_at?: string | null;
};
