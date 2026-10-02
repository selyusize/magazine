import "server-only";

import { cookies } from "next/headers";

import { getJwtExpiry } from "./jwt";

/**
 * Сессия покупателя живёт в httpOnly-cookie на домене витрины:
 * JS в браузере не может прочитать ни JWT, ни id корзины (защита от XSS).
 * Читать и менять их можно только на сервере: в Server Actions, RSC и proxy.
 */
export const SESSION_COOKIE = {
  token: "_medusa_jwt",
  cartId: "_medusa_cart_id",
} as const;

const CART_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней
const TOKEN_FALLBACK_MAX_AGE = 60 * 60 * 24 * 7;

/** `lax`, а не `strict`: cookie должны доходить при возврате с внешней страницы оплаты. */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge,
  } as const;
}

/** COOKIE_SECURE=false — для прод-сборки по http (например, Docker на localhost в Safari). */
function isSecureCookie() {
  const override = process.env.COOKIE_SECURE;
  if (override) return override === "true";
  return process.env.NODE_ENV === "production";
}

/** Время жизни cookie = времени жизни JWT (берётся из `exp`), чтобы они истекали вместе. */
export function tokenMaxAge(token: string) {
  const expiresAt = getJwtExpiry(token);
  if (!expiresAt) return TOKEN_FALLBACK_MAX_AGE;
  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
}

export async function getAuthToken() {
  return (await cookies()).get(SESSION_COOKIE.token)?.value;
}

export async function setAuthToken(token: string) {
  (await cookies()).set(SESSION_COOKIE.token, token, sessionCookieOptions(tokenMaxAge(token)));
}

export async function removeAuthToken() {
  (await cookies()).delete(SESSION_COOKIE.token);
}

export async function getCartId() {
  return (await cookies()).get(SESSION_COOKIE.cartId)?.value;
}

export async function setCartId(cartId: string) {
  (await cookies()).set(SESSION_COOKIE.cartId, cartId, sessionCookieOptions(CART_MAX_AGE));
}

export async function removeCartId() {
  (await cookies()).delete(SESSION_COOKIE.cartId);
}

/** Заголовки для приватных запросов в Medusa от имени текущего покупателя. */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
