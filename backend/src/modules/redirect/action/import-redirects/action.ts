import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";
import { requireAdminShop } from "@shared/shop/shop-context";

import { ImportRedirectsHandler } from "../../command/import-redirects/handler";
import type { ImportRedirectsBody } from "./schema";

/** Импорт правил из CSV (`откуда;куда;код`) в текущий магазин: всё или ничего, ошибка — с номером строки. */
@Injectable()
export class ImportRedirectsAction implements Action<
  AuthenticatedMedusaRequest<ImportRedirectsBody>
> {
  constructor(private readonly handler: ImportRedirectsHandler) {}

  async handle(
    req: AuthenticatedMedusaRequest<ImportRedirectsBody>,
    res: MedusaResponse,
  ): Promise<void> {
    const result = await this.handler.handle({
      shop_id: requireAdminShop(req).id,
      redirects: req.validatedBody.redirects,
    });
    res.json(result);
  }
}
