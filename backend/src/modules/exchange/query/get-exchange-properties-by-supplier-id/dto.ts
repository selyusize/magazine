/** Свойство поставщика с маппингом на характеристику магазина. */
export type ExchangePropertyDTO = {
  id: string;
  external_id: string;
  name: string;
  values: Record<string, string>;
  attribute_id: string | null;
  attribute_name: string | null;
};
