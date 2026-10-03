import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { DeleteRedirectHandler } from "../../command/delete-redirect/handler";

/** Удаление правила; ответ — как у DELETE в Admin API Medusa. */
@Injectable()
export class DeleteRedirectAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly handler: DeleteRedirectHandler) {}

  async handle(
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
  ): Promise<void> {
    await this.handler.handle({ id: req.params.id });
    res.json({ id: req.params.id, object: "redirect", deleted: true });
  }
}
