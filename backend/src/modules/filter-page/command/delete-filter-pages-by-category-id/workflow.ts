import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import { filterPageCRUD } from "../../crud";
import type { DeleteFilterPagesByCategoryIdCommand } from "./command";
import { findFilterPageIdsStep } from "./step/find-filter-page-ids";

/** Удаление — тем же workflow, что и из админки: события `filter_page.deleted` закроют страницы кодом 410. */
export const deleteFilterPagesByCategoryIdWorkflow = createWorkflow(
  "delete-filter-pages-by-category-id",
  (command: DeleteFilterPagesByCategoryIdCommand) => {
    const ids = findFilterPageIdsStep(command);
    filterPageCRUD.workflows.delete.runAsStep({
      input: transform(ids, (ids) => ({ ids })),
    });
    return new WorkflowResponse(undefined);
  },
);
