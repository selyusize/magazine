import { z } from "@medusajs/framework/zod";

/** Значения области целиком: товар (`variant_id` не передан или `null`) или один вариант. */
export const SetAttributeValuesForProductSchema = z.object({
  variant_id: z.string().trim().min(1).nullable().optional(),
  values: z
    .array(
      z.object({
        attribute_id: z.string().trim().min(1),
        value: z.string().max(1000),
      }),
    )
    .max(500),
});

export type SetAttributeValuesForProductBody = z.infer<
  typeof SetAttributeValuesForProductSchema
>;
