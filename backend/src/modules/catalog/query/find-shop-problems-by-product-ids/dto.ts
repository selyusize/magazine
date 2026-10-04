import type { ProductShopProblem } from "../../service/product-shop-rules";

/** Товар, который не согласован со своим магазином (черновики тоже). */
export type ShopProblemDTO = {
  product_id: string;
  title: string;
  problems: ProductShopProblem[];
};
