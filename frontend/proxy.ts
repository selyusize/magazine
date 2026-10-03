import type { NextRequest } from "next/server";

import { contentSecurityPolicy, createNonce } from "@shared/lib/csp";
import { resolveRedirect, rewriteToNotFound } from "@shared/redirects";
import { refreshSession } from "@shared/session";

/**
 * 0. Редиректы из Medusa (смена handle, старый сайт) — до рендера; удалённая страница — 404 магазина
 *    (src/shared/redirects).
 * 1. CSP с новым nonce на каждый запрос: Next берёт nonce из CSP-заголовка запроса и ставит его своим скриптам.
 * 2. Продлевает JWT покупателя в httpOnly-cookie до истечения (см. src/shared/session/refresh.ts).
 */
export async function proxy(request: NextRequest) {
  const redirect = await resolveRedirect(request);
  if (redirect?.type === "redirect") return redirect.response;

  const nonce = createNonce();
  const csp = contentSecurityPolicy(nonce);
  request.headers.set("x-nonce", nonce);
  request.headers.set("content-security-policy", csp);

  const session = await refreshSession(request);
  const response = redirect?.type === "gone" ? rewriteToNotFound(request, session) : session;
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  // Только страницы: без статики, картинок и API-роутов
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)"],
};
