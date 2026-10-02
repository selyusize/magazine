import "server-only";

import { env } from "@shared/config";

/**
 * Content-Security-Policy витрины, собирается в proxy.ts на каждый запрос.
 *
 * Скрипты — только свои и с nonce текущего запроса. Next сам проставляет nonce своим скриптам,
 * а 'strict-dynamic' разрешает скриптам с nonce подгружать другие (next/script, счётчики).
 * Инлайн-стили разрешены: UI-библиотеки пишут атрибут style, а nonce на атрибуты не действует.
 *
 * Внешние источники (Метрика, платёжный виджет, CDN картинок) добавляются переменными окружения
 * через пробел — читаются в рантайме, пересобирать образ не нужно:
 * CSP_SCRIPT_SRC, CSP_CONNECT_SRC, CSP_IMG_SRC, CSP_FRAME_SRC, CSP_FORM_ACTION, CSP_FRAME_ANCESTORS.
 */

/** Кому можно встраивать витрину во фрейм: сам сайт и Вебвизор Яндекс Метрики. */
const DEFAULT_FRAME_ANCESTORS = [
  "'self'",
  "https://metrika.yandex.ru",
  "https://metrika.yandex.by",
  "https://metrika.yandex.kz",
  "https://metrika.yandex.com",
  "https://analytics.yandex.com",
];

export function createNonce() {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

function fromEnv(name: string) {
  return (process.env[name] ?? "").split(/\s+/).filter(Boolean);
}

export function contentSecurityPolicy(nonce: string) {
  const isDev = process.env.NODE_ENV === "development";
  const apiOrigin = new URL(env.publicApiUrl).origin;
  const frameAncestors = fromEnv("CSP_FRAME_ANCESTORS");

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // React в dev восстанавливает стеки через eval; в проде eval не нужен
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : []), ...fromEnv("CSP_SCRIPT_SRC")],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", apiOrigin, ...fromEnv("CSP_IMG_SRC")],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", apiOrigin, ...(isDev ? ["ws:"] : []), ...fromEnv("CSP_CONNECT_SRC")],
    "frame-src": ["'self'", ...fromEnv("CSP_FRAME_SRC")],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'", ...fromEnv("CSP_FORM_ACTION")],
    "frame-ancestors": frameAncestors.length ? frameAncestors : DEFAULT_FRAME_ANCESTORS,
  };

  const policy = Object.entries(directives).map(([name, sources]) => `${name} ${sources.join(" ")}`);
  // В dev API на http://localhost — апгрейд до https его сломает
  if (!isDev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}
