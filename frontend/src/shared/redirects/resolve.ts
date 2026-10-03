import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { normalizePath } from "./path";
import { getRedirectRules } from "./table";

/** Что делать с запросом: увести на новый адрес, показать 404 магазина (страница удалена) или ничего. */
export type RedirectResult = { type: "redirect"; response: NextResponse } | { type: "gone" } | null;

/** Пути нет ни в одном роуте — Next рендерит `app/not-found.tsx` со статусом 404. */
const GONE_PATH = "/_gone";

/**
 * Для proxy.ts: путь есть в таблице редиректов Medusa → 301/302 на новый адрес (query сохраняется — метки
 * рекламы не теряются) или «удалено» (правило 410). Только GET/HEAD: POST на страницу — это Server Action,
 * его не уводим.
 */
export async function resolveRedirect(request: NextRequest): Promise<RedirectResult> {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const rule = (await getRedirectRules()).get(normalizePath(request.nextUrl.pathname));
  if (!rule) return null;
  if (rule.toPath === null) return { type: "gone" };

  const target = new URL(rule.toPath, request.nextUrl);
  target.search = request.nextUrl.search;
  return { type: "redirect", response: NextResponse.redirect(target, rule.code) };
}

/**
 * Удалённая страница: вместо 410 — обычная 404 магазина с шапкой и каталогом (rewrite в Next статус 410 не
 * сохраняет, а для поисковиков 404 и 410 почти равны). Заголовки запроса (nonce CSP) и cookie продлённой
 * сессии берутся из уже собранного ответа proxy.
 */
export function rewriteToNotFound(request: NextRequest, response: NextResponse): NextResponse {
  const notFound = NextResponse.rewrite(new URL(GONE_PATH, request.nextUrl), { request });
  for (const cookie of response.cookies.getAll()) notFound.cookies.set(cookie);
  return notFound;
}
