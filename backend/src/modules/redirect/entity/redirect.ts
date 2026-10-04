import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Правило редиректа витрины магазина `shop_id`. `to_path = null` — страницы больше нет (410).
 * `entity_*` заполнены у автоматических редиректов (смена handle), у ручных — null. Пути у магазинов свои:
 * `/products/utyug` может быть в двух магазинах, поэтому `from_path` уникален в паре `(shop_id, from_path)`.
 */
export const Redirect = model
  .define("redirect", {
    id: model.id({ prefix: "redir" }).primaryKey(),
    shop_id: model.text(),
    from_path: model.text(),
    to_path: model.text().nullable(),
    code: model.number(),
    entity_type: model.text().nullable(),
    entity_id: model.text().nullable(),
  })
  // Индексы начинаются с `shop_id`: все чтения и правила без цепочек — внутри магазина
  .indexes([
    { on: ["shop_id", "from_path"], unique: true },
    { on: ["shop_id", "to_path"] },
  ]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type RedirectEntity = InferTypeOf<typeof Redirect>;
