import { Injectable } from "@shared/container";

import { FindShopProblemsByProductIdsFetcher } from "../query/find-shop-problems-by-product-ids/fetcher";
import { productShopError } from "./product-shop-rules";

/**
 * Товар живёт в одном магазине (план, шаг 4): проверка из хуков создания и изменения товара
 * (`src/workflows/hooks/product-guards.ts`). Ловит то, что команды каталога проверить не могут, — смену канала
 * продаж у товара с брендом и характеристиками прежнего магазина. Ошибка откатывает workflow Medusa.
 */
@Injectable()
export class ProductShopGuard {
  constructor(private readonly problems: FindShopProblemsByProductIdsFetcher) {}

  async assert(productIds: string[]): Promise<void> {
    const problems = await this.problems.fetch({ product_ids: productIds });
    if (problems.length) throw productShopError(problems);
  }
}
