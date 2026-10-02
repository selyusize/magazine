import { describe, expect, it } from "vitest";

import { decodeJwt, getJwtExpiry, isJwtExpired, shouldRefreshJwt } from "@shared/session/jwt";

import { fakeJwt, nowSec } from "../helpers/jwt";

const HOUR = 60 * 60;

describe("JWT: сроки жизни токена", () => {
  it("читает iat/exp из payload", () => {
    expect(decodeJwt(fakeJwt({ iat: 100, exp: 200 }))).toMatchObject({ iat: 100, exp: 200 });
  });

  it("мусор вместо токена → null, без исключений", () => {
    expect(decodeJwt("not-a-jwt")).toBeNull();
    expect(decodeJwt("a.%%%.c")).toBeNull();
    expect(getJwtExpiry("not-a-jwt")).toBeNull();
  });

  it("время истечения — в миллисекундах", () => {
    expect(getJwtExpiry(fakeJwt({ exp: 1_000 }))).toBe(1_000_000);
  });

  it("свежий токен не обновляется", () => {
    const now = nowSec();
    expect(shouldRefreshJwt(fakeJwt({ iat: now, exp: now + 24 * HOUR }))).toBe(false);
  });

  it("токен обновляется, когда прошла половина срока жизни", () => {
    const now = nowSec();
    const token = fakeJwt({ iat: now - 13 * HOUR, exp: now + 11 * HOUR });
    expect(shouldRefreshJwt(token)).toBe(true);
  });

  it("без iat/exp обновление не запускается", () => {
    expect(shouldRefreshJwt(fakeJwt({}))).toBe(false);
  });

  it("истёкший токен определяется, действующий — нет", () => {
    const now = nowSec();
    expect(isJwtExpired(fakeJwt({ iat: now - 2 * HOUR, exp: now - 1 }))).toBe(true);
    expect(isJwtExpired(fakeJwt({ iat: now, exp: now + HOUR }))).toBe(false);
  });
});
