import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { REDIRECT_MODULE } from "../../../index";
import type { RedirectModuleService } from "../../../service/redirect-module-service";
import type { URLEntityType } from "../../../service/path";

export type RemoveEntityPathInput = {
  entity_type: URLEntityType;
  entity_id: string;
};

type Output = { path: string | null };
type Compensation = RemoveEntityPathInput & { path: string };

/** Забывает путь удалённой сущности и отдаёт его; `path: null` — путь не отслеживался (или уже закрыт). */
export const removeEntityPathStep = createStep(
  "remove-entity-path",
  async (input: RemoveEntityPathInput, { container }) => {
    const paths = container.resolve<RedirectModuleService>(REDIRECT_MODULE);
    const [current] = await paths.listEntityPaths({
      entity_type: input.entity_type,
      entity_id: input.entity_id,
    });
    if (!current)
      return new StepResponse<Output, Compensation | null>(
        { path: null },
        null,
      );

    await paths.deleteEntityPaths(current.id);
    return new StepResponse<Output, Compensation | null>(
      { path: current.path },
      { ...input, path: current.path },
    );
  },
  async (compensation, { container }) => {
    if (!compensation) return;
    await container
      .resolve<RedirectModuleService>(REDIRECT_MODULE)
      .createEntityPaths(compensation);
  },
);
