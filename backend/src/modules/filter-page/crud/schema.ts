import { z } from "@medusajs/framework/zod";

/** `{ "brand": ["nike"], "color": ["black", "white"] }` — код фильтра → выбранные значения. */
const FiltersSchema = z.record(
  z.string().trim().min(1).max(100),
  z.array(z.string().trim().min(1).max(200)).max(50),
);

const fields = {
  category_id: z.string().trim().min(1),
  title: z.string().trim().min(1).max(300),
  /** Пусто — из названия. Уникален внутри категории. */
  handle: z.string().trim().max(200).optional(),
  filters: FiltersSchema.optional(),
  is_active: z.boolean().optional(),
};

export const CreateFilterPageSchema = z.object(fields);
export const UpdateFilterPageSchema = z.object(fields).partial();
