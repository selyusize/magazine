import { z } from "@medusajs/framework/zod";

/** `null` — снять категорию. */
export const MapExchangeGroupToCategorySchema = z.object({
  category_id: z.string().trim().min(1).nullable(),
});

export type MapExchangeGroupToCategoryBody = z.infer<typeof MapExchangeGroupToCategorySchema>;
