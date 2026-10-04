import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";

import { REDIRECT_UPDATED, toRedirectEventData } from "../../service/redirect-events";

import { saveRedirectsStep } from "../../step/save-redirects";
import type { ImportRedirectsCommand } from "./command";
import type { ImportedRedirectsDTO } from "./dto";

export const importRedirectsWorkflow = createWorkflow(
  "import-redirects",
  (command: ImportRedirectsCommand) => {
    const redirects = saveRedirectsStep(
      transform(command, (command) =>
        command.redirects.map((redirect) => ({
          ...redirect,
          shop_id: command.shop_id,
        })),
      ),
    );
    emitEventStep({
      eventName: REDIRECT_UPDATED,
      data: transform(command, (command) => toRedirectEventData([command.shop_id])),
    });

    return new WorkflowResponse(
      transform(redirects, (redirects): ImportedRedirectsDTO => ({
        count: redirects.length,
      })),
    );
  },
);
