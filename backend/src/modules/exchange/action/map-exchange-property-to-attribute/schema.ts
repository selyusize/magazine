import { z } from "@medusajs/framework/zod";

/** `null` — снять характеристику (значения свойства уйдут в metadata товара). */
export const MapExchangePropertyToAttributeSchema = z.object({
  attribute_id: z.string().trim().min(1).nullable(),
});

export type MapExchangePropertyToAttributeBody = z.infer<typeof MapExchangePropertyToAttributeSchema>;
