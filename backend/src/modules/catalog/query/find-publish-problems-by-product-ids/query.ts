export type FindPublishProblemsByProductIdsQuery = {
  product_ids: string[];
  /** Проверить и черновики — «можно ли опубликовать» (импорт поставщика публикует только готовые). */
  include_drafts?: boolean;
};
