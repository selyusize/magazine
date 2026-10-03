import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import { saveRedirectsStep } from "../../step/save-redirects";
import type { SaveRedirectCommand } from "./command";
import type { SavedRedirectDTO } from "./dto";

export const saveRedirectWorkflow = createWorkflow(
  "save-redirect",
  (command: SaveRedirectCommand) => {
    const redirects = saveRedirectsStep(
      transform(command, (command) => [command]),
    );

    return new WorkflowResponse(
      transform(redirects, ([redirect]): SavedRedirectDTO => ({
        id: redirect.id,
        from_path: redirect.from_path,
        to_path: redirect.to_path,
        code: redirect.code,
      })),
    );
  },
);
