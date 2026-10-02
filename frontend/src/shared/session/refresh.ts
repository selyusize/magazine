import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { postAdminAuthTokenRefresh } from "@shared/api";

import { SESSION_COOKIE, sessionCookieOptions, tokenMaxAge } from "./cookies";
import { isJwtExpired, shouldRefreshJwt } from "./jwt";

/**
 * Для proxy.ts: продлевает JWT покупателя до истечения, убирает протухший.
 * Новый токен кладётся и в ответ (браузеру), и в текущий запрос — чтобы RSC
 * этого же рендера уже видели обновлённую cookie.
 * Заголовки запроса всегда передаются дальше (`next({ request })`): в них nonce для CSP.
 */
export async function refreshSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE.token)?.value;
  if (!token) return NextResponse.next({ request });

  if (isJwtExpired(token)) {
    request.cookies.delete(SESSION_COOKIE.token);
    const response = NextResponse.next({ request });
    response.cookies.delete(SESSION_COOKIE.token);
    return response;
  }

  if (!shouldRefreshJwt(token)) return NextResponse.next({ request });

  try {
    const { token: fresh } = await postAdminAuthTokenRefresh({
      headers: { Authorization: `Bearer ${token}` },
    });
    request.cookies.set(SESSION_COOKIE.token, fresh);
    const response = NextResponse.next({ request });
    response.cookies.set(SESSION_COOKIE.token, fresh, sessionCookieOptions(tokenMaxAge(fresh)));
    return response;
  } catch {
    // Medusa недоступна или отклонила токен — оставляем как есть, он ещё валиден
    return NextResponse.next({ request });
  }
}
