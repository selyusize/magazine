import { createReadStream, createWriteStream } from "node:fs";
import type { Dirent } from "node:fs";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Transform, type Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { MedusaError } from "@medusajs/framework/utils";

export type PackageStorageOptions = {
  /** Корень хранилища: `backend/exchange` локально, `/app/exchange` (volume) в Docker. Наружу не отдаётся. */
  dir: string;
};

/**
 * Пакеты обмена на диске: папка на запуск, файлы в ней. Все пути — относительно корня и не выходят за него
 * (имена файлов приходят от 1С и из архивов). Собирается в src/container/common/exchange.ts.
 */
export class PackageStorage {
  constructor(private readonly options: PackageStorageOptions) {}

  /** Абсолютный путь внутри хранилища; попытка выйти за корень — INVALID_DATA. */
  resolve(...parts: string[]): string {
    const root = path.resolve(this.options.dir);
    const target = path.resolve(root, ...parts.map((part) => part.replace(/\\/g, "/")));
    if (target !== root && !target.startsWith(root + path.sep))
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Недопустимый путь «${parts.join("/")}»`);
    return target;
  }

  /** Дописывает поток в файл (1С шлёт большие файлы частями). Больше `max_bytes` за раз — INVALID_DATA. */
  async append(dir: string, file: string, stream: Readable, maxBytes: number): Promise<number> {
    const target = this.resolve(dir, file);
    await mkdir(path.dirname(target), { recursive: true });
    let written = 0;
    const limit = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        written += chunk.length;
        if (written > maxBytes)
          callback(new MedusaError(MedusaError.Types.INVALID_DATA, `Файл ${file} больше ${maxBytes} байт за раз`));
        else callback(null, chunk);
      },
    });
    await pipeline(stream, limit, createWriteStream(target, { flags: "a" }));
    return written;
  }

  /** Файлы папки рекурсивно, пути относительно неё через `/`, по алфавиту. Папки нет — пусто. */
  async list(dir: string): Promise<string[]> {
    const root = this.resolve(dir);
    const entries: Dirent[] = await readdir(root, { recursive: true, withFileTypes: true }).catch(() => []);
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"))
      .sort();
  }

  read(dir: string, file: string): Readable {
    return createReadStream(this.resolve(dir, file));
  }

  async exists(dir: string, file: string): Promise<boolean> {
    return stat(this.resolve(dir, file)).then(
      (info) => info.isFile(),
      () => false,
    );
  }

  async remove(dir: string): Promise<void> {
    await rm(this.resolve(dir), { recursive: true, force: true });
  }
}
