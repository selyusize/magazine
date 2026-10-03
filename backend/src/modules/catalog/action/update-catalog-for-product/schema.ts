import { z } from "@medusajs/framework/zod";

/** Не передано — не меняется, `null` — снять. */
export const UpdateCatalogForProductSchema = z.object({
  brand_id: z.string().trim().min(1).nullable().optional(),
  main_category_id: z.string().trim().min(1).nullable().optional(),
});

export type UpdateCatalogForProductBody = z.infer<
  typeof UpdateCatalogForProductSchema
>;
