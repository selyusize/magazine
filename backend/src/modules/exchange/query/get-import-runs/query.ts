/** Список запусков для админки: история поставщика или все, свежие сверху. */
export type GetImportRunsQuery = {
  supplier_id?: string;
  status?: string;
  limit: number;
  offset: number;
};
