type JwtPayload = { exp?: number; iat?: number };

/**
 * Читает payload JWT без проверки подписи — только чтобы узнать сроки.
 * Подпись проверяет Medusa на каждом запросе.
 */
export function decodeJwt(token: string): JwtPayload | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JwtPayload;
  } catch {
    return null;
  }
}

/** Момент истечения токена, мс. */
export function getJwtExpiry(token: string) {
  const exp = decodeJwt(token)?.exp;
  return exp ? exp * 1000 : null;
}

/** Пора обновлять: прошло больше половины срока жизни токена. */
export function shouldRefreshJwt(token: string, now = Date.now()) {
  const payload = decodeJwt(token);
  if (!payload?.exp || !payload.iat) return false;
  const halfLife = ((payload.exp - payload.iat) * 1000) / 2;
  return payload.exp * 1000 - now < halfLife;
}

export function isJwtExpired(token: string, now = Date.now()) {
  const expiresAt = getJwtExpiry(token);
  return expiresAt !== null && expiresAt <= now;
}
