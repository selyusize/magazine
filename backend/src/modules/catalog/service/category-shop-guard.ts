import { Injectable } from "@shared/container";

import { FindCategoryShopsByIdsFetcher } from "../query/find-category-shops-by-ids/fetcher";
import { categoryShopError, findCategoryShopProblem } from "./category-shop-rules";

/**
 * Изменённые категории остались в дереве своего магазина: хук `categoriesUpdated`
 * (`src/workflows/hooks/product-category-shop.ts`). Перенос под категорию другого магазина или в корень — 400,
 * workflow Medusa откатывает изменение.
 */
@Injectable()
export class CategoryShopGuard {
  constructor(private readonly categories: FindCategoryShopsByIdsFetcher) {}

  async assert(categoryIds: string[]): Promise<void> {
    const categories = await this.categories.fetch({ category_ids: categoryIds });
    const problems = categories.flatMap((category) => {
      const problem = findCategoryShopProblem(category);
      return problem ? [{ name: category.name, problem }] : [];
    });
    if (problems.length) throw categoryShopError(problems);
  }
}
