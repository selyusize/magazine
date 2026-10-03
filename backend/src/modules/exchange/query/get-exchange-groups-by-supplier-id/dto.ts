/** Группа поставщика с маппингом на категорию магазина. */
export type ExchangeGroupDTO = {
  id: string;
  external_id: string;
  parent_external_id: string | null;
  name: string;
  category_id: string | null;
  category_name: string | null;
};
