import { z } from "@medusajs/framework/zod";

export const ATTRIBUTE_TYPES = ["string", "number", "boolean"] as const;

const fields = {
  name: z.string().trim().min(1).max(200),
  /** Код для адресов фильтров. Пусто — из названия. */
  handle: z.string().trim().max(200).optional(),
  type: z.enum(ATTRIBUTE_TYPES).optional(),
  unit: z.string().trim().max(50).nullable().optional(),
  is_filterable: z.boolean().optional(),
  is_visible: z.boolean().optional(),
  rank: z.number().int().min(0).max(100_000).optional(),
};

export const CreateAttributeSchema = z.object(fields);
export const UpdateAttributeSchema = z.object(fields).partial();
