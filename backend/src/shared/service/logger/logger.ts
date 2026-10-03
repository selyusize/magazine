import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import type { Logger as MedusaLogger } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";

export type LoggerOptions = {
  /** Папка для файловых логов: `backend/logs` локально, `/app/logs` (volume) в Docker */
  dir: string;
};

type Level = "debug" | "info" | "warn" | "error";

/** Имя файла лога: латиница, цифры, `-` и `_` — без путей, чтобы не выйти за пределы папки логов */
const FILE_NAME = /^[a-z0-9][a-z0-9_-]*$/i;

/**
 * Логгер поверх логгера Medusa (stdout). `toFile(name)` дополнительно пишет в `<dir>/<name>.log` —
 * для длинных процессов, которые разбирают по файлу: импорт поставщика, обмен с 1С, генерация фидов.
 * Собирается в src/container/common/logger.ts: `Container.from(container).get(Logger)` или параметр конструктора.
 */
export class Logger {
  constructor(
    protected readonly options: LoggerOptions,
    protected readonly logger: MedusaLogger,
  ) {}

  debug(message: string, data?: unknown): void {
    this.write("debug", message, data);
  }

  info(message: string, data?: unknown): void {
    this.write("info", message, data);
  }

  warn(message: string, data?: unknown): void {
    this.write("warn", message, data);
  }

  error(message: string, data?: unknown): void {
    this.write("error", message, data);
  }

  /** Логгер, который пишет и в stdout, и в `<dir>/<name>.log`: `logger.toFile("import-supplier-acme")` */
  toFile(name: string): FileLogger {
    if (!FILE_NAME.test(name)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Логгер: недопустимое имя файла «${name}» — только латиница, цифры, «-» и «_»`,
      );
    }
    return new FileLogger(
      this.options,
      this.logger,
      path.join(this.options.dir, `${name}.log`),
    );
  }

  protected write(level: Level, message: string, data?: unknown): void {
    this.logger[level](
      data === undefined ? message : `${message} ${serialize(data)}`,
    );
  }
}

/** Пишет в файл по очереди: строки не перемешиваются, ошибка записи в файл не роняет вызывающий код. */
export class FileLogger extends Logger {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    options: LoggerOptions,
    logger: MedusaLogger,
    readonly file: string,
  ) {
    super(options, logger);
  }

  /** Дожидается записи всех строк — в конце job или скрипта, перед выходом из процесса */
  flush(): Promise<void> {
    return this.queue;
  }

  protected override write(
    level: Level,
    message: string,
    data?: unknown,
  ): void {
    super.write(level, message, data);

    const line =
      JSON.stringify({ time: new Date().toISOString(), level, message, data }) +
      "\n";
    this.queue = this.queue
      .then(() => mkdir(this.options.dir, { recursive: true }))
      .then(() => appendFile(this.file, line, "utf8"))
      .catch((error: Error) => {
        this.logger.error(
          `logger/to-file: не удалось записать в ${this.file}: ${error.message}`,
        );
      });
  }
}

function serialize(data: unknown): string {
  if (data instanceof Error) return data.stack ?? data.message;
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}
