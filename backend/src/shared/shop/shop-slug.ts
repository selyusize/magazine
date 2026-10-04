import { z } from "@medusajs/framework/zod";

import { SLUG_PATTERN } from "../service/slug/slug";

/** Короткий: slug магазина — префикс каждого handle товара, категории и коллекции (`shop-handle.ts`). */
export const SHOP_SLUG_MAX_LENGTH = 32;

/** Slug магазина: латиница, цифры и одиночные дефисы (`olisa`, `snow-shop`); после создания не меняется. */
export const ShopSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(SHOP_SLUG_MAX_LENGTH)
  .regex(
    SLUG_PATTERN,
    "Только латиница в нижнем регистре, цифры и одиночные дефисы",
  );
