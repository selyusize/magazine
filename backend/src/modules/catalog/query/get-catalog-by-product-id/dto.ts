/** Место товара в каталоге магазина: бренд, основная категория и все его категории (из них выбирают основную). */
export type ProductCatalogDTO = {
  product_id: string;
  brand: { id: string; name: string; handle: string } | null;
  main_category: { id: string; name: string; handle: string } | null;
  categories: { id: string; name: string; handle: string }[];
};
