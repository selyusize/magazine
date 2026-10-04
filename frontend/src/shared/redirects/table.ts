import "server-only";

import { getRedirects, type GetRedirects200RedirectsItem } from "@shared/api";

export type RedirectRule = GetRedirects200RedirectsItem;

/**
 * Страховка: сколько таблица живёт в памяти, если вебхук ревалидации (тег `redirects`) не дошёл. Обычно правка в
 * админке доходит до витрины за секунды — через `invalidateRedirectRules`.
 */
export const REDIRECTS_TTL_MS = 60_000;
/** Бэкенд недоступен — повторяем не на каждом запросе, а с паузой. */
const RETRY_MS = 5_000;

type Table = {
  cached: { rules: Map<string, RedirectRule>; expiresAt: number } | null;
  loading: Promise<Map<string, RedirectRule>> | null;
};

/**
 * Таблица — в `globalThis`, а не в переменной модуля: proxy и роут ревалидации Next собирает в разные бандлы, но
 * они живут в одном процессе Node (self-hosted), и сброс из роута должен дойти до proxy.
 */
declare global {
  var __storefrontRedirectRules: Table | undefined;
}

function table(): Table {
  return (globalThis.__storefrontRedirectRules ??= { cached: null, loading: null });
}

async function load(): Promise<Map<string, RedirectRule>> {
  const { redirects } = await getRedirects({ cache: "no-store" });
  return new Map(redirects.map((rule) => [rule.fromPath, rule]));
}

function refresh(): Promise<Map<string, RedirectRule>> {
  const state = table();
  state.loading ??= load()
    .then((rules) => {
      state.cached = { rules, expiresAt: Date.now() + REDIRECTS_TTL_MS };
      return rules;
    })
    .catch(() => {
      // Сайт без редиректов лучше, чем лежащий сайт: отдаём прежнюю таблицу (или пустую)
      const rules = state.cached?.rules ?? new Map<string, RedirectRule>();
      state.cached = { rules, expiresAt: Date.now() + RETRY_MS };
      return rules;
    })
    .finally(() => {
      state.loading = null;
    });
  return state.loading;
}

/**
 * Таблица редиректов из `GET /store/redirects`, ключ — нормализованный путь. Держится в памяти процесса Next
 * (proxy живёт в нём же — self-hosted Node): ждём только первую загрузку, дальше устаревшая таблица отдаётся
 * сразу, а свежая подтягивается в фоне.
 */
export async function getRedirectRules(): Promise<Map<string, RedirectRule>> {
  const { cached } = table();
  if (!cached) return refresh();
  if (Date.now() >= cached.expiresAt) void refresh();
  return cached.rules;
}

/**
 * Тег `redirects` пришёл вебхуком: правила изменились — перечитываем сразу, не дожидаясь TTL. Пока грузится
 * новая, proxy отдаёт прежнюю таблицу.
 */
export async function invalidateRedirectRules(): Promise<void> {
  const state = table();
  if (state.cached) state.cached.expiresAt = 0;
  await refresh();
}
