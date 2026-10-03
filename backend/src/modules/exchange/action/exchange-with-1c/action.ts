import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetExchangeSupplierByIdFetcher } from "../../query/get-exchange-supplier-by-id/fetcher";
import { EXCHANGE_COOKIE } from "../../service/exchange-session";
import { CheckAuthMode } from "../../service/protocol/check-auth-mode";
import { ExchangeAuthenticator } from "../../service/protocol/exchange-authenticator";
import { type ExchangeMode, type ExchangeReply, failure } from "../../service/protocol/exchange-mode";
import { FileMode } from "../../service/protocol/file-mode";
import { ImportMode } from "../../service/protocol/import-mode";
import { InitMode } from "../../service/protocol/init-mode";
import type { ExchangeWith1CParams } from "./schema";

type Request = MedusaRequest<unknown, ExchangeWith1CParams>;

/**
 * `/1c/exchange/:supplier` — стандартный протокол обмена 1С с сайтом (каталог). Отвечает текстом, как ждёт 1С:
 * `success` / `progress` / `failure\nпричина`. Выключенный поставщик или поставщик без push — `failure`, обмен
 * заказами (`type=sale`) — этап 15.
 */
@Injectable()
export class ExchangeWith1CAction implements Action<Request> {
  private readonly modes: ExchangeMode[];

  constructor(
    private readonly suppliers: GetExchangeSupplierByIdFetcher,
    private readonly auth: ExchangeAuthenticator,
    checkAuth: CheckAuthMode,
    init: InitMode,
    file: FileMode,
    importMode: ImportMode,
  ) {
    this.modes = [checkAuth, init, file, importMode];
  }

  async handle(req: Request, res: MedusaResponse): Promise<void> {
    const { type, mode, filename } = req.validatedQuery;
    const supplier = await this.suppliers.fetch({ supplier_id: req.params.supplier });
    const basic = this.auth.basic(supplier, req.headers.authorization);

    let reply: ExchangeReply;
    if (!supplier.is_active || supplier.settings.mode !== "push")
      reply = failure("Обмен с этим поставщиком выключен", 403);
    else if (!basic && !this.auth.hasSession(supplier, req.headers.cookie))
      reply = failure("Неверный логин или пароль", 401);
    else if (type === "sale") reply = failure("Обмен заказами пока не поддерживается");
    else {
      const strategy = this.modes.find((candidate) => candidate.mode === mode);
      reply = strategy
        ? await strategy.handle({ supplier, filename: filename ?? null, body: req, basic })
        : failure(`Режим ${mode} не поддерживается`, 400);
    }

    if (reply.session) res.setHeader("Set-Cookie", `${EXCHANGE_COOKIE}=${reply.session}; Path=/1c; HttpOnly`);
    res
      .status(reply.status ?? 200)
      .type("text/plain; charset=utf-8")
      .send(reply.lines.join("\n"));
  }
}
