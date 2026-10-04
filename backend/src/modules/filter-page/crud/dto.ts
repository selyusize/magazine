export type FilterPageDTO = {
  id: string;
  category_id: string;
  /** Категория для админки и пути `/catalog/{category.handle}/{handle}` (handle витрины); `null` — категорию удалили. */
  category: { name: string; handle: string } | null;
  title: string;
  handle: string;
  filters: Record<string, string[]>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};
