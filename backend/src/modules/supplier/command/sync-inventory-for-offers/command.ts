/** Предложения созданы, изменены или удалены — пересчитать остатки их вариантов. */
export type SyncInventoryForOffersCommand = {
  offer_ids: string[];
};
