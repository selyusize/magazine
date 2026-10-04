import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Посадочная магазина `shop_id` «категория + значения фильтров» (`Кроссовки Nike`): своя индексируемая страница
 * `/catalog/{категория}/{handle}`. Handle уникален внутри категории, категория — из дерева того же магазина. `filters` — `{ код фильтра: [значения] }`,
 * код — `handle` характеристики (модуль attribute), значение — `handle` её значения.
 */
export const FilterPage = model
  .define("filter_page", {
    id: model.id({ prefix: "fpage" }).primaryKey(),
    shop_id: model.text(),
    category_id: model.text().index(),
    title: model.text().searchable(),
    handle: model.text(),
    filters: model.json().default({}),
    is_active: model.boolean().default(true),
  })
  // Индекс начинается с `shop_id` — он же для списков магазина
  .indexes([{ on: ["shop_id", "category_id", "handle"], unique: true }]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type FilterPageEntity = InferTypeOf<typeof FilterPage>;
