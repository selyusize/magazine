/**
 * Применить данные выгрузки к карточкам товаров поставщика-владельца: название, описание, фото, категория, бренд
 * (с защитой ручных правок), характеристики и прочие свойства. `package_dir` — где лежат картинки пакета.
 */
export type ApplyExchangeProductContentCommand = {
  supplier_id: string;
  package_dir: string;
  external_ids: string[];
};
