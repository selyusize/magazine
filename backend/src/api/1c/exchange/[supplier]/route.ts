import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { ExchangeWith1CAction } from "@domain/exchange/action/exchange-with-1c/action";
import type { ExchangeWith1CParams } from "@domain/exchange/action/exchange-with-1c/schema";

type Request = MedusaRequest<unknown, ExchangeWith1CParams>;

/** Протокол обмена 1С: `checkauth`, `init`, `import` 1С шлёт GET-ом, `file` — POST-ом с файлом в теле. */
export const GET = (req: Request, res: MedusaResponse) =>
  Container.from(req.scope).get(ExchangeWith1CAction).handle(req, res);

export const POST = (req: Request, res: MedusaResponse) =>
  Container.from(req.scope).get(ExchangeWith1CAction).handle(req, res);
