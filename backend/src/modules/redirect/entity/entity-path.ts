import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Последний известный путь сущности на витрине её магазина (`/products/futbolka`). В событии `product.updated`
 * старого handle нет — по этой записи видно, что путь сменился и откуда ставить 301. `shop_id` — куда ставить 301
 * и 410: после удаления сущности её магазин известен только отсюда.
 */
export const EntityPath = model
  .define("entity_path", {
    id: model.id({ prefix: "epath" }).primaryKey(),
    shop_id: model.text(),
    entity_type: model.text(),
    entity_id: model.text(),
    path: model.text(),
  })
  .indexes([{ on: ["entity_type", "entity_id"], unique: true }]);

/** Строка таблицы — только внутри модуля. */
export type EntityPathEntity = InferTypeOf<typeof EntityPath>;
