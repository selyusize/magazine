import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Middleware } from "@shared/contract/middleware";
import { recordOf, texts } from "@shared/query/narrow";

import { CollectionProductsGuard } from "../../service/collection-products-guard";

/** Роут Medusa `POST /admin/collections/:id/products`: добавляемые товары — только магазина коллекции (400). */
@Injectable()
export class CheckCollectionProductsMiddleware implements Middleware {
  constructor(private readonly guard: CollectionProductsGuard) {}

  async handle(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction): Promise<void> {
    await this.guard.assert({ collection_id: req.params.id, product_ids: texts(recordOf(req.body).add) });
    next();
  }
}
