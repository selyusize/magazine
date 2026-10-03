import "server-only";

import { getRedirects, type GetRedirects200RedirectsItem } from "@shared/api";

export type RedirectRule = GetRedirects200RedirectsItem;

/** Сколько таблица живёт в памяти: правка в админке доходит до витрины за это время. */
export const REDIRECTS_TTL_MS = 60_000;
/** Бэкенд недоступен — повторяем не на каждом запросе, а с паузой. */
const RETRY_MS = 5_000;

let cached: { rules: Map<string, RedirectRule>; expiresAt: number } | null = null;
let loading: Promise<Map<string, RedirectRule>> | null = null;

async function load(): Promise<Map<string, RedirectRule>> {
  const { redirects } = await getRedirects({ cache: "no-store" });
  return new Map(redirects.map((rule) => [rule.fromPath, rule]));
}

function refresh(): Promise<Map<string, RedirectRule>> {
  loading ??= load()
    .then((rules) => {
      cached = { rules, expiresAt: Date.now() + REDIRECTS_TTL_MS };
      return rules;
    })
    .catch(() => {
      // Сайт без редиректов лучше, чем лежащий сайт: отдаём прежнюю таблицу (или пустую)
      const rules = cached?.rules ?? new Map<string, RedirectRule>();
      cached = { rules, expiresAt: Date.now() + RETRY_MS };
      return rules;
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

/**
 * Таблица редиректов из `GET /store/redirects`, ключ — нормализованный путь. Держится в памяти процесса Next
 * (proxy живёт в нём же — self-hosted Node): ждём только первую загрузку, дальше устаревшая таблица отдаётся
 * сразу, а свежая подтягивается в фоне.
 */
export async function getRedirectRules(): Promise<Map<string, RedirectRule>> {
  if (!cached) return refresh();
  if (Date.now() >= cached.expiresAt) void refresh();
  return cached.rules;
}
