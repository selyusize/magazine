import { z } from "@medusajs/framework/zod";

const fields = {
  name: z.string().trim().min(1).max(200),
  /** Пусто — из названия. */
  handle: z.string().trim().max(200).optional(),
  description: z.string().trim().max(10_000).nullable().optional(),
  is_active: z.boolean().optional(),
};

export const CreateBrandSchema = z.object(fields);
export const UpdateBrandSchema = z.object(fields).partial();
