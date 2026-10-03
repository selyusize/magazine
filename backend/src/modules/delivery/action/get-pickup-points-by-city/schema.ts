import { z } from "@medusajs/framework/zod";

import { DELIVERY_PROVIDERS } from "../../query/get-pickup-points-by-city/dto";

export const GetPickupPointsByCitySchema = z.object({
  provider: z.enum(DELIVERY_PROVIDERS),
  city: z.string().trim().min(2).max(100),
});

export type GetPickupPointsByCityParams = z.infer<
  typeof GetPickupPointsByCitySchema
>;
