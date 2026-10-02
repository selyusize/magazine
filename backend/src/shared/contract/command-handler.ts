import type { Command } from "./command";
import type { DTO } from "./dto";

/** Обработчик команды: принимает Command, возвращает DTO, массив DTO или ничего. */
export interface CommandHandler<TCommand extends Command, TResult extends DTO | DTO[] | void> {
  handle(command: TCommand): Promise<TResult>;
}
