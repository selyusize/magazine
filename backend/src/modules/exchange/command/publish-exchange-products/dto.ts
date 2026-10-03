/** Сколько карточек опубликовано и сколько товаров в очереди «требует разбора» среди пачки. */
export type PublishedExchangeProductsDTO = {
  published: number;
  needs_review: number;
};
