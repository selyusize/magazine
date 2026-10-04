import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SetDefaultSalesChannelCommand } from "./command";
import { setDefaultSalesChannelWorkflow } from "./workflow";

/** Канал первого магазина — каналом по умолчанию; вызывается из `initial-data-seed`. */
@Injectable()
export class SetDefaultSalesChannelHandler extends AbstractCommandHandler<
  SetDefaultSalesChannelCommand,
  void
> {
  protected readonly workflow = setDefaultSalesChannelWorkflow;
}
