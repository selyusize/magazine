import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { SaveRedirectHandler } from "../../command/save-redirect/handler";
import type { SaveRedirectBody } from "./schema";

/** Ручное правило из админки: создаёт или перезаписывает правило с тем же «откуда». */
@Injectable()
export class SaveRedirectAction implements Action<
  AuthenticatedMedusaRequest<SaveRedirectBody>
> {
  constructor(private readonly handler: SaveRedirectHandler) {}

  async handle(
    req: AuthenticatedMedusaRequest<SaveRedirectBody>,
    res: MedusaResponse,
  ): Promise<void> {
    const redirect = await this.handler.handle({
      from_path: req.validatedBody.from_path,
      to_path: req.validatedBody.to_path,
      code: req.validatedBody.code,
    });
    res.json({ redirect });
  }
}
