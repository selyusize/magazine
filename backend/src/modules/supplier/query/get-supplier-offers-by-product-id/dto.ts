/** Предложение в карточке товара в админке: кто, по какому варианту, почём и сколько. */
export type ProductSupplierOfferDTO = {
  id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_is_active: boolean;
  variant_id: string;
  variant_title: string;
  external_id: string;
  sku: string | null;
  barcode: string | null;
  purchase_price: number | null;
  quantity: number;
  synced_at: Date | null;
};
