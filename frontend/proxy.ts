import type { NextRequest } from "next/server";

import { contentSecurityPolicy, createNonce } from "@shared/lib/csp";
import { refreshSession } from "@shared/session";

/**
 * 1. CSP с новым nonce на каждый запрос: Next берёт nonce из CSP-заголовка запроса и ставит его своим скриптам.
 * 2. Продлевает JWT покупателя в httpOnly-cookie до истечения (см. src/shared/session/refresh.ts).
 */
export async function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = contentSecurityPolicy(nonce);
  request.headers.set("x-nonce", nonce);
  request.headers.set("content-security-policy", csp);

  const response = await refreshSession(request);
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  // Только страницы: без статики, картинок и API-роутов
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)"],
};
