/** Поставщика включили, выключили, удалили или создали его склад — пересчитать остатки его вариантов. */
export type SyncInventoryForSupplierCommand = {
  supplier_id: string;
};
