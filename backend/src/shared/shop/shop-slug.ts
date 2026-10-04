import { z } from "@medusajs/framework/zod";

import { SLUG_PATTERN } from "../service/slug/slug";

/** Короткий: slug магазина — префикс каждого handle товара, категории и коллекции. */
export const SHOP_SLUG_MAX_LENGTH = 32;

/**
 * Разделитель префикса магазина в handle сущностей Medusa: `olisa--utyug-philips`. В самом slug (`SLUG_PATTERN`)
 * двойного дефиса не бывает, поэтому префикс отделяется однозначно.
 */
export const SHOP_HANDLE_SEPARATOR = "--";

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

/** Handle сущности Medusa в БД: handle глобально уникален, поэтому хранится с префиксом магазина. */
export const toStoredHandle = ({
  shop,
  handle,
}: {
  shop: string;
  handle: string;
}): string => `${shop}${SHOP_HANDLE_SEPARATOR}${handle}`;

/**
 * Handle из БД → магазин и slug: `olisa--utyug-philips` → `{ shop: "olisa", handle: "utyug-philips" }`. Без
 * префикса (сущности до мультимагазина, ручной ввод) — `shop: null` и handle целиком.
 */
export function splitStoredHandle(stored: string): {
  shop: string | null;
  handle: string;
} {
  const index = stored.indexOf(SHOP_HANDLE_SEPARATOR);
  const shop = index > 0 ? stored.slice(0, index) : "";
  if (!ShopSlugSchema.safeParse(shop).success || shop !== shop.trim())
    return { shop: null, handle: stored };
  return {
    shop,
    handle: stored.slice(index + SHOP_HANDLE_SEPARATOR.length),
  };
}
