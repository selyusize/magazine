import { routes } from "@shared/config";

/**
 * Куда вернуть покупателя после входа: `?next=/cart` → `/cart`.
 * Только относительные пути сайта — иначе `?next=https://evil.com` превратился бы в открытый редирект.
 */
export function safeRedirect(next: string | string[] | undefined | null, fallback: string = routes.account): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
