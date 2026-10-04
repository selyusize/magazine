import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import type { Middleware } from "@shared/contract/middleware";
import { recordOf, texts } from "@shared/query/narrow";

/**
 * Admin API `POST /admin/sales-channels/:id/products`: Medusa привязывает товары к каналу workflow без хуков товара,
 * поэтому проверка магазина (`ProductGuards`) там не срабатывает. А при правиле «товар — ровно в одном канале магазина»
 * этот роут может только сломать товар: добавить второй канал или снять единственный. Канал меняется в карточке товара
 * (`POST /admin/products/:id` с `sales_channels` — через хуки). Пустой запрос пропускаем.
 */
@Injectable()
export class RejectSalesChannelProductsMiddleware implements Middleware {
  async handle(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction): Promise<void> {
    const body = recordOf(req.body);
    if (texts(body.add).length || texts(body.remove).length)
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Товар состоит ровно в одном канале магазина: канал меняется в карточке товара, а не списком в канале продаж",
      );
    next();
  }
}
