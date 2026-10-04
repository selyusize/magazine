import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { UpdateNetworkSettingsHandler } from "../../command/update-network-settings/handler";
import type { UpdateNetworkSettingsBody } from "./schema";

/** POST /admin/network-settings — сохраняет реквизиты сети. */
@Injectable()
export class UpdateNetworkSettingsAction implements Action<
  AuthenticatedMedusaRequest<UpdateNetworkSettingsBody>
> {
  constructor(private readonly handler: UpdateNetworkSettingsHandler) {}

  async handle(
    req: AuthenticatedMedusaRequest<UpdateNetworkSettingsBody>,
    res: MedusaResponse,
  ): Promise<void> {
    res.json({
      network_settings: await this.handler.handle(req.validatedBody),
    });
  }
}
