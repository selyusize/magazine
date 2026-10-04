import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { Container } from "@container/index";

import { FindCategoryShopsByIdsFetcher } from "../../../query/find-category-shops-by-ids/fetcher";
import { categoryShopError, expectedCategoryShop } from "../../../service/category-shop-rules";
import type { AssignShopToCategoriesCommand } from "../command";
import type { AssignedCategoryShopDTO } from "../dto";

/**
 * Только чтение: магазин каждой новой категории — магазин родителя. Без родителя или под ничьей категорией —
 * 400: категория вне деревьев магазинов не видна ни одной витрине.
 */
export const planCategoryShopLinksStep = createStep(
  "plan-category-shop-links",
  async (command: AssignShopToCategoriesCommand, { container }) => {
    const categories = await Container.from(container)
      .get(FindCategoryShopsByIdsFetcher)
      .fetch({ category_ids: command.category_ids });

    const outside = categories.filter((category) => expectedCategoryShop(category) === null);
    if (outside.length)
      throw categoryShopError(outside.map((category) => ({ name: category.name, problem: "outside_shop_tree" })));

    const links: AssignedCategoryShopDTO[] = categories.flatMap((category) => {
      const shopId = expectedCategoryShop(category);
      return shopId && category.shop_id !== shopId ? [{ category_id: category.id, shop_id: shopId }] : [];
    });
    return new StepResponse(links);
  },
);
