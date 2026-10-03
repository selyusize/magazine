/** Группа поставщика → категория магазина (`null` — снять). Применится к товарам на следующем импорте. */
export type MapExchangeGroupToCategoryCommand = { id: string; category_id: string | null };
