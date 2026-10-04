import "server-only";

import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import { z } from "zod";

import { cacheTags } from "@shared/api";
import { env } from "@shared/config";
import { invalidateRedirectRules } from "@shared/redirects";

/** Заголовок с секретом магазина — контракт `backend/docs/storefront.md`. */
export const REVALIDATE_SECRET_HEADER = "x-revalidate-secret";

/** Next не принимает теги длиннее 256 символов; пачка бэкенда — до сотни тегов сущностей плюс групповые. */
const RevalidateBodySchema = z.object({
  tags: z.array(z.string().min(1).max(256)).min(1).max(500),
});

/** Сравнение секрета за постоянное время; пустой секрет витрины — вебхук выключен. */
function isValidSecret(given: string | null): boolean {
  if (!env.revalidateSecret || !given) return false;
  const expected = Buffer.from(env.revalidateSecret);
  const actual = Buffer.from(given);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Вебхук ревалидации от бэкенда: `POST /api/revalidate` `{ tags }` с секретом магазина. Данные с тегами устаревают
 * сразу (`expire: 0` — следующий запрос идёт в Medusa, а не отдаёт старое), тег `redirects` перечитывает таблицу
 * редиректов proxy.
 */
export async function handleRevalidate(request: Request): Promise<Response> {
  if (!isValidSecret(request.headers.get(REVALIDATE_SECRET_HEADER))) {
    return Response.json({ message: "Неверный секрет ревалидации" }, { status: 401 });
  }

  const parsed = RevalidateBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: "Ожидается { tags: string[] }" }, { status: 400 });
  }

  const tags = [...new Set(parsed.data.tags)];
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  if (tags.includes(cacheTags.redirects)) await invalidateRedirectRules();

  return Response.json({ revalidated: tags });
}
