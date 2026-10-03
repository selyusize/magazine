import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/** Статья блога: страница `/blog/{handle}`. Черновик на витрине не виден. */
export const Article = model.define("article", {
  id: model.id({ prefix: "art" }).primaryKey(),
  title: model.text().searchable(),
  handle: model.text().unique(),
  excerpt: model.text().nullable(),
  body: model.text().nullable(),
  status: model.enum(["draft", "published"]).default("draft"),
});

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type ArticleEntity = InferTypeOf<typeof Article>;
