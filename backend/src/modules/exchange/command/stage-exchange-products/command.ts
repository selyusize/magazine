import type { ImportedProduct } from "../../service/imported-product";

/**
 * Пачка товаров `import.xml`: данные запоминаются в `exchange_product` (карточку создаст первое предложение),
 * у существующих карточек владельца сразу обновляется содержимое. `content_hash` тот же — товар пропускается.
 */
export type StageExchangeProductsCommand = {
  supplier_id: string;
  package_dir: string;
  publish: boolean;
  products: (ImportedProduct & { content_hash: string })[];
};
