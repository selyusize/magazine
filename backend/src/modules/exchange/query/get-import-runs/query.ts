/** Список запусков для админки: история магазина (все его поставщики) или одного его поставщика, свежие сверху. */
export type GetImportRunsQuery = {
  shop_id: string;
  supplier_id?: string;
  status?: string;
  limit: number;
  offset: number;
};
