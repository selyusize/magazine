export type GetRedirectsForAdminQuery = {
  /** Текущий магазин админки. */
  shop_id: string;
  /** Подстрока в «откуда» или «куда». */
  q?: string;
  limit: number;
  offset: number;
};
