import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { PublishExchangeProductsCommand } from "./command";
import type { PublishedExchangeProductsDTO } from "./dto";
import { publishExchangeProductsWorkflow } from "./workflow";

/** Публикует готовые карточки поставщика и отмечает неготовые для разбора. */
@Injectable()
export class PublishExchangeProductsHandler extends AbstractCommandHandler<
  PublishExchangeProductsCommand,
  PublishedExchangeProductsDTO
> {
  protected readonly workflow = publishExchangeProductsWorkflow;
}
