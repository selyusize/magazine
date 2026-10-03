import { z } from "@medusajs/framework/zod";

const fields = {
  name: z.string().trim().min(1).max(200),
  /** Пусто — из названия. */
  handle: z.string().trim().max(200).optional(),
  description: z.string().trim().max(10_000).nullable().optional(),
  is_active: z.boolean().optional(),
  /** Написания бренда у поставщиков — по ним импорт находит этот бренд. */
  synonyms: z.array(z.string().trim().min(1).max(200)).max(100).optional(),
};

export const CreateBrandSchema = z.object(fields);
export const UpdateBrandSchema = z.object(fields).partial();
