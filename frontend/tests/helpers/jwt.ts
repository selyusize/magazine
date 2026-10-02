/** Неподписанный JWT с нужными iat/exp (секунды) — для проверки логики сроков без Medusa. */
export function fakeJwt(payload: { iat?: number; exp?: number }) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

export const nowSec = () => Math.floor(Date.now() / 1000);
