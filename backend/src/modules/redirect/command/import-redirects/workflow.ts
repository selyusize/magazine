import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import { saveRedirectsStep } from "../../step/save-redirects";
import type { ImportRedirectsCommand } from "./command";
import type { ImportedRedirectsDTO } from "./dto";

export const importRedirectsWorkflow = createWorkflow(
  "import-redirects",
  (command: ImportRedirectsCommand) => {
    const redirects = saveRedirectsStep(
      transform(command, (command) => command.redirects),
    );

    return new WorkflowResponse(
      transform(redirects, (redirects): ImportedRedirectsDTO => ({
        count: redirects.length,
      })),
    );
  },
);
