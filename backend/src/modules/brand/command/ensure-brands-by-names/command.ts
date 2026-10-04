/** Бренды магазина по названиям из выгрузки его поставщика: найти (по названию и синонимам) или создать. */
export type EnsureBrandsByNamesCommand = {
  shop_id: string;
  names: string[];
};
