import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { UpdateNetworkSettingsCommand } from "./command";
import type { UpdatedNetworkSettingsDTO } from "./dto";
import { updateNetworkSettingsWorkflow } from "./workflow";

/** Реквизиты сети из админки — POST /admin/network-settings. */
@Injectable()
export class UpdateNetworkSettingsHandler extends AbstractCommandHandler<
  UpdateNetworkSettingsCommand,
  UpdatedNetworkSettingsDTO
> {
  protected readonly workflow = updateNetworkSettingsWorkflow;
}
