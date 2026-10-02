import type { MedusaContainer } from "@medusajs/framework/types";
import type { ReturnWorkflow } from "@medusajs/framework/workflows-sdk";

import type { Command } from "../contract/command";
import type { CommandHandler } from "../contract/command-handler";
import type { DTO } from "../contract/dto";
import { Injectable, InjectContainer } from "../container/injectable";

/** Обработчик команды: снаружи handle(command), внутри — workflow с шагами и откатом. */
@Injectable()
export abstract class AbstractCommandHandler<TCommand extends Command, TResult extends DTO | DTO[] | void>
  implements CommandHandler<TCommand, TResult>
{
  protected abstract readonly workflow: ReturnWorkflow<TCommand, TResult, []>;

  constructor(@InjectContainer() protected readonly container: MedusaContainer) {}

  async handle(command: TCommand): Promise<TResult> {
    const { result } = await this.workflow(this.container).run({ input: command });
    return result;
  }
}
