/**
 * Предложения поставщика пачкой (импорт): по `supplier_id + external_id` — создать или обновить.
 * `quantity: null` — остаток в выгрузке не пришёл (`prices.xml`), прежний не трогаем.
 */
export type UpsertSupplierOffersCommand = {
  offers: {
    supplier_id: string;
    variant_id: string;
    external_id: string;
    sku: string | null;
    barcode: string | null;
    purchase_price: number | null;
    quantity: number | null;
    /** ISO-строка. */
    synced_at: string;
  }[];
};
