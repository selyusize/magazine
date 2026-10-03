import { Injectable } from "@shared/container";

import { EXCHANGE_COOKIE, ExchangeSession } from "../exchange-session";
import { type ExchangeReply, type ExchangeRequest, ExchangeMode, failure } from "./exchange-mode";

/** `mode=checkauth`: только по Basic; ответ — имя и значение cookie, с которой 1С придёт дальше. */
@Injectable()
export class CheckAuthMode extends ExchangeMode {
  readonly mode = "checkauth";

  constructor(private readonly session: ExchangeSession) {
    super();
  }

  async handle(request: ExchangeRequest): Promise<ExchangeReply> {
    if (!request.basic) return failure("Неверный логин или пароль", 401);
    const token = this.session.issue(request.supplier.id);
    return { lines: ["success", EXCHANGE_COOKIE, token], session: token };
  }
}
