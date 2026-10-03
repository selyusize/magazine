import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import type { ClearMainCategoryByCategoryIdCommand } from "./command";
import { removeMainCategoriesStep } from "./step/remove-main-categories";

/**
 * Товары остаются без основной категории — опубликованные не снимаются, но следующее их сохранение потребует
 * выбрать новую (проверка перед публикацией).
 */
export const clearMainCategoryByCategoryIdWorkflow = createWorkflow(
  "clear-main-category-by-category-id",
  (command: ClearMainCategoryByCategoryIdCommand) => {
    removeMainCategoriesStep(command);
    return new WorkflowResponse(undefined);
  },
);
