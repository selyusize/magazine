/** Итог пачки `import.xml`: новые, изменившиеся и пропущенные товары, ошибки содержимого. */
export type StagedExchangeProductsDTO = {
  created: number;
  updated: number;
  skipped: number;
  errors: { external_id: string | null; message: string }[];
};
