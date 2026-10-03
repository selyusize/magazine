import { SignedToken, type SignedTokenOptions } from "@shared/service/signed-token/signed-token";

/** Имя cookie сессии обмена — 1С возвращает его в каждом запросе после `checkauth`. */
export const EXCHANGE_COOKIE = "exchange_session";

/**
 * Сессия протокола обмена 1С: после `checkauth` поставщик получает подписанную cookie со своим id и дальше
 * ходит с ней (или снова с Basic). Хранить сессии негде и не нужно — подпись проверяет любой server-инстанс.
 */
export class ExchangeSession {
  private readonly tokens: SignedToken;

  constructor(
    options: SignedTokenOptions,
    private readonly ttlSeconds: number,
  ) {
    this.tokens = new SignedToken(options);
  }

  issue(supplierId: string): string {
    return this.tokens.sign(supplierId, this.ttlSeconds);
  }

  /** Поставщик сессии или `null`, если cookie чужая, поддельная или истекла. */
  supplierOf(cookie: string | undefined): string | null {
    return cookie ? this.tokens.verify(cookie) : null;
  }
}
