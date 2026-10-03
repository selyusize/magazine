import { z } from "@shared/lib/zod";

/** Максимальная длина запроса: длиннее — обрезается, а не ошибка */
export const SEARCH_QUERY_MAX = 100;

/** `?q=a&q=b` приходит массивом — берём первое значение */
const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

/**
 * Параметры страницы поиска из URL. Мусор в адресе не роняет страницу: неверное значение → значение по умолчанию.
 */
export const searchParamsSchema = z.object({
  q: z.preprocess(
    first,
    z
      .string()
      .trim()
      .transform((q) => q.slice(0, SEARCH_QUERY_MAX))
      .catch(""),
  ),
  page: z.preprocess(first, z.coerce.number().int().min(1).catch(1)),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;
