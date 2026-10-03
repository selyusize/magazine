import { Injectable } from "@shared/container";

import { StartImportRunHandler } from "../../command/start-import-run/handler";
import { ExchangeConfig } from "../exchange-config";
import { type ExchangeReply, type ExchangeRequest, ExchangeMode } from "./exchange-mode";

/** `mode=init`: новый сеанс — новый запуск в статусе `receiving`; просим zip и говорим, сколько байт за раз. */
@Injectable()
export class InitMode extends ExchangeMode {
  readonly mode = "init";

  constructor(
    private readonly start: StartImportRunHandler,
    private readonly config: ExchangeConfig,
  ) {
    super();
  }

  async handle(request: ExchangeRequest): Promise<ExchangeReply> {
    await this.start.handle({ supplier_id: request.supplier.id, source: "push", status: "receiving" });
    return { lines: ["zip=yes", `file_limit=${this.config.options.file_limit}`] };
  }
}
