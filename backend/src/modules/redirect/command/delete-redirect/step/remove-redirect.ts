import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { REDIRECT_MODULE } from "../../../index";
import type {
  RedirectChanges,
  RedirectModuleService,
} from "../../../service/redirect-module-service";
import type { DeleteRedirectCommand } from "../command";

export const removeRedirectStep = createStep(
  "remove-redirect",
  async (command: DeleteRedirectCommand, { container }) => {
    const redirects = container.resolve<RedirectModuleService>(REDIRECT_MODULE);
    const [redirect] = await redirects.listRedirects({ id: command.id });
    if (!redirect)
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Редирект ${command.id} не найден`,
      );

    await redirects.deleteRedirects(redirect.id);
    const changes: RedirectChanges = {
      created: [],
      updated: [],
      deleted: [
        {
          id: redirect.id,
          shop_id: redirect.shop_id,
          from_path: redirect.from_path,
          to_path: redirect.to_path,
          code: redirect.code,
          entity_type: redirect.entity_type,
          entity_id: redirect.entity_id,
        },
      ],
    };
    return new StepResponse({ shop_id: redirect.shop_id }, changes);
  },
  async (changes, { container }) => {
    if (!changes) return;
    await container
      .resolve<RedirectModuleService>(REDIRECT_MODULE)
      .revertRedirectChanges(changes);
  },
);
