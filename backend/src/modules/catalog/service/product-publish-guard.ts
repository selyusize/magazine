import { Injectable } from "@shared/container";

import { FindPublishProblemsByProductIdsFetcher } from "../query/find-publish-problems-by-product-ids/fetcher";
import { publishError } from "./publish-requirements";

/**
 * Проверка перед публикацией (план, этап 2.6): вызывается из хуков workflows создания и изменения товара
 * (`src/workflows/hooks/product-publish-requirements.ts`). Ошибка в хуке валит workflow Medusa, и он
 * откатывает изменение — опубликованный товар не может остаться без обязательных полей.
 */
@Injectable()
export class ProductPublishGuard {
  constructor(
    private readonly problems: FindPublishProblemsByProductIdsFetcher,
  ) {}

  async assertPublishable(productIds: string[]): Promise<void> {
    const problems = await this.problems.fetch({ product_ids: productIds });
    if (problems.length) throw publishError(problems);
  }
}
