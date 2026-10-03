export type SupplierOfferDTO = {
  id: string;
  supplier_id: string;
  supplier: { name: string } | null;
  variant_id: string;
  /** Вариант и товар для админки; `null` — вариант удалили. */
  variant: { title: string; sku: string | null; product_id: string } | null;
  external_id: string;
  sku: string | null;
  barcode: string | null;
  purchase_price: number | null;
  quantity: number;
  synced_at: Date | null;
  created_at: Date;
  updated_at: Date;
};
