/** Пересчитать остатки вариантов на складах поставщиков по их предложениям. */
export type SyncInventoryForVariantsCommand = {
  variant_ids: string[];
};
