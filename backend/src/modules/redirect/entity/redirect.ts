import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Правило редиректа витрины. `to_path = null` — страницы больше нет (410).
 * `entity_*` заполнены у автоматических редиректов (смена handle), у ручных — null.
 */
export const Redirect = model
  .define("redirect", {
    id: model.id({ prefix: "redir" }).primaryKey(),
    from_path: model.text().unique(),
    to_path: model.text().nullable(),
    code: model.number(),
    entity_type: model.text().nullable(),
    entity_id: model.text().nullable(),
  })
  .indexes([{ on: ["to_path"] }]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type RedirectEntity = InferTypeOf<typeof Redirect>;
