import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Основная категория товара: от неё крошки и canonical, на неё — 301, когда товар сняли навсегда (этап 3.4).
 * Дерево — собственное дерево магазина (`product_category` Medusa), не дерево поставщика. Одна строка на товар.
 */
export const ProductMainCategory = model.define("product_main_category", {
  id: model.id({ prefix: "pmcat" }).primaryKey(),
  product_id: model.text().unique(),
  category_id: model.text().index(),
});

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type ProductMainCategoryEntity = InferTypeOf<typeof ProductMainCategory>;
