/** Очередь «требует разбора» поставщика: товары с причинами и несопоставленные группы. */
export type ExchangeReviewDTO = {
  products: {
    external_id: string;
    product_id: string | null;
    title: string;
    status: string | null;
    problems: string[];
  }[];
  count: number;
  unmapped_groups: number;
};
