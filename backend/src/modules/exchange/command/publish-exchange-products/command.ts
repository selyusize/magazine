/**
 * Товары пачки после записи: готовые черновики владельца — опубликовать (если поставщику это разрешено),
 * неготовые — в очередь «требует разбора» с причинами.
 */
export type PublishExchangeProductsCommand = {
  supplier_id: string;
  external_ids: string[];
  publish: boolean;
};
