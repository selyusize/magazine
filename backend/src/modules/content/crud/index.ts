import { defineCRUD } from "@shared/crud/define-crud";
import type { CRUDRow } from "@shared/crud/definition";
import { oneOf, text, textOrNull, toDate } from "@shared/query/narrow";

import { CONTENT_MODULE } from "../index";
import type { ArticleDTO } from "./dto";
import { ARTICLE_STATUSES, CreateArticleSchema, UpdateArticleSchema } from "./schema";

const toArticleDTO = (row: CRUDRow): ArticleDTO => ({
  id: row.id,
  title: text(row.title),
  handle: text(row.handle),
  excerpt: textOrNull(row.excerpt),
  body: textOrNull(row.body),
  status: oneOf(row.status, ARTICLE_STATUSES, "draft"),
  created_at: toDate(row.created_at),
  updated_at: toDate(row.updated_at),
});

/** CRUD статей для админки — /admin/articles. Handle — slug из заголовка, события `article.*` → редиректы. */
export const articleCRUD = defineCRUD<ArticleDTO>({
  entity: "article",
  module: CONTENT_MODULE,
  model: "Article",
  label: "статья",
  response: { one: "article", many: "articles" },
  fields: [
    "id",
    "title",
    "handle",
    "excerpt",
    "body",
    "status",
    "created_at",
    "updated_at",
  ],
  search: ["title", "handle"],
  filters: ["status"],
  handle: { from: "title" },
  schemas: { create: CreateArticleSchema, update: UpdateArticleSchema },
  toDTO: toArticleDTO,
});
