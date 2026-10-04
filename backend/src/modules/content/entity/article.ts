import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Статья блога магазина `shop_id`: страница `/blog/{handle}`. Черновик на витрине не виден. Handle уникален внутри
 * магазина — у двух магазинов может быть статья `kak-vybrat-utyug`.
 */
export const Article = model
  .define("article", {
    id: model.id({ prefix: "art" }).primaryKey(),
    shop_id: model.text(),
    title: model.text().searchable(),
    handle: model.text(),
    excerpt: model.text().nullable(),
    body: model.text().nullable(),
    status: model.enum(["draft", "published"]).default("draft"),
  })
  // Индекс начинается с `shop_id` — он же для списков магазина
  .indexes([{ on: ["shop_id", "handle"], unique: true }]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type ArticleEntity = InferTypeOf<typeof Article>;
