/** Поставщика создали или изменили — его склад должен существовать и совпадать с ним по названию и адресу. */
export type SyncStockLocationForSupplierCommand = {
  supplier_id: string;
};
