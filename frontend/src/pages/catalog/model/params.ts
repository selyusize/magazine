import { z } from "@shared/lib/zod";

/** `?page=a&page=b` приходит массивом — берём первое значение */
const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

/** Параметры каталога из URL. Мусор в адресе не роняет страницу: неверное значение → значение по умолчанию. */
export const catalogParamsSchema = z.object({
  page: z.preprocess(first, z.coerce.number().int().min(1).catch(1)),
  sort: z.preprocess(first, z.string().optional().catch(undefined)),
});

/**
 * Адрес страницы каталога. Без значений по умолчанию (первая страница, сортировка по умолчанию) —
 * у одной выдачи один URL. filters — пары `[ключ, значение]` в порядке конфига.
 */
export function catalogHref(
  path: string,
  { page, sort, filters = [] }: { page?: number; sort?: string; filters?: [string, string][] },
): string {
  const params = new URLSearchParams();
  if (sort) params.set("sort", sort);
  for (const [key, value] of filters) params.append(key, value);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
