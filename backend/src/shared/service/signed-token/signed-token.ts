import { createHmac, timingSafeEqual } from "node:crypto";

export type SignedTokenOptions = {
  /** Секрет подписи: без него токен подделать нельзя. */
  secret: string;
};

/**
 * Подписанный токен без хранилища: `<данные>.<истекает>.<подпись>`. Нужен там, где состояние держать негде:
 * server-инстансов несколько, а сессия обмена 1С живёт между запросами (cookie после `checkauth`).
 */
export class SignedToken {
  constructor(private readonly options: SignedTokenOptions) {}

  sign(payload: string, ttlSeconds: number, now = Date.now()): string {
    const body = `${Buffer.from(payload).toString("base64url")}.${Math.floor(now / 1000) + ttlSeconds}`;
    return `${body}.${this.signature(body)}`;
  }

  /** Данные токена или `null`, если подпись неверна или срок вышел. */
  verify(token: string, now = Date.now()): string | null {
    const [payload, expires, signature] = token.split(".");
    if (!payload || !expires || !signature) return null;

    const expected = Buffer.from(this.signature(`${payload}.${expires}`));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    if (Number(expires) * 1000 < now) return null;
    return Buffer.from(payload, "base64url").toString();
  }

  private signature(body: string): string {
    return createHmac("sha256", this.options.secret).update(body).digest("base64url");
  }
}
