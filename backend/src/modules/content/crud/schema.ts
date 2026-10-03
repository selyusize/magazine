import { z } from "@medusajs/framework/zod";

export const ARTICLE_STATUSES = ["draft", "published"] as const;

const fields = {
  title: z.string().trim().min(1).max(300),
  /** Пусто — из заголовка. */
  handle: z.string().trim().max(200).optional(),
  excerpt: z.string().trim().max(1000).nullable().optional(),
  body: z.string().max(200_000).nullable().optional(),
  status: z.enum(ARTICLE_STATUSES).optional(),
};

export const CreateArticleSchema = z.object(fields);
export const UpdateArticleSchema = z.object(fields).partial();
