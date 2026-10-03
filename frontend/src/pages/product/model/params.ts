import { PRODUCT_VARIANT_PARAM } from "@shared/config";
import { z } from "@shared/lib/zod";

/** `?variant=a&variant=b` приходит массивом — берём первое значение */
const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

/** Параметры страницы товара из URL. Мусор не роняет страницу: неизвестный вариант просто не выбран */
export const productParamsSchema = z
  .object({ [PRODUCT_VARIANT_PARAM]: z.preprocess(first, z.string().optional().catch(undefined)) })
  .transform((params) => ({ variant: params[PRODUCT_VARIANT_PARAM] }));

/** Номер страницы (отзывов) из адреса: мусор и массивы → первая страница */
export const pageNumberSchema = z.preprocess(first, z.coerce.number().int().min(1).catch(1));

/**
 * Адрес страницы отзывов: первая — без параметра (одна выдача — один адрес), якорь — к блоку отзывов,
 * чтобы после перехода не листать страницу вниз
 */
export function reviewsHref(path: string, param: string, page: number): string {
  return page > 1 ? `${path}?${param}=${page}#${param}` : `${path}#${param}`;
}
