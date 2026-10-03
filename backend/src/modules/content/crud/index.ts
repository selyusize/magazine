import { defineCRUD } from "@shared/crud/define-crud";
import type { CRUDRow } from "@shared/crud/definition";

import { CONTENT_MODULE } from "../index";
import type { ArticleDTO } from "./dto";
import { CreateArticleSchema, UpdateArticleSchema } from "./schema";

const toArticleDTO = (row: CRUDRow): ArticleDTO => ({
  id: row.id,
  title: String(row.title),
  handle: String(row.handle),
  excerpt: (row.excerpt as string | null) ?? null,
  body: (row.body as string | null) ?? null,
  status: row.status as ArticleDTO["status"],
  created_at: new Date(row.created_at as string),
  updated_at: new Date(row.updated_at as string),
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
