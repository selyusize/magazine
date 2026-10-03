import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import { MedusaError } from "@medusajs/framework/utils";
import yauzl, { type Entry, type ZipFile } from "yauzl";

export type ZipExtractorOptions = {
  /** Предел распакованного объёма архива, байт: защита от zip-бомбы. */
  max_bytes: number;
};

const invalid = (message: string) => new MedusaError(MedusaError.Types.INVALID_DATA, `ZIP: ${message}`);

/**
 * Распаковка пакета обмена (zip от 1С или поставщика) на диск по одному файлу — архив на сотни МБ не грузится
 * в память. Пути внутри архива не выходят за папку назначения (zip-slip), объём ограничен `max_bytes`.
 * Собирается в src/container/common/exchange.ts.
 */
export class ZipExtractor {
  constructor(private readonly options: ZipExtractorOptions) {}

  /** Распаковывает архив в `target`, возвращает пути распакованных файлов относительно `target`. */
  async extract(archive: string, target: string): Promise<string[]> {
    const zip = await open(archive);
    const files: string[] = [];
    let total = 0;

    try {
      for await (const entry of entries(zip)) {
        if (entry.fileName.endsWith("/")) continue;
        const relative = safeRelativePath(entry.fileName);
        const destination = path.join(target, relative);
        await mkdir(path.dirname(destination), { recursive: true });

        const limit = this.options.max_bytes;
        const counter = new Transform({
          transform(chunk: Buffer, _encoding, callback) {
            total += chunk.length;
            if (total > limit) callback(invalid(`распакованный архив больше ${limit} байт`));
            else callback(null, chunk);
          },
        });
        await pipeline(await openEntry(zip, entry), counter, createWriteStream(destination));
        files.push(relative);
      }
    } finally {
      zip.close();
    }
    return files;
  }
}

/** Путь из архива → относительный путь без `..`, абсолютных путей и обратных слэшей Windows. */
export function safeRelativePath(name: string): string {
  const normalized = path.posix.normalize(name.replace(/\\/g, "/")).replace(/^\/+/, "");
  if (!normalized || normalized === "." || normalized.startsWith("../") || normalized === "..")
    throw invalid(`недопустимый путь в архиве «${name}»`);
  return normalized;
}

const open = (archive: string) =>
  new Promise<ZipFile>((resolve, reject) =>
    yauzl.open(archive, { lazyEntries: true, decodeStrings: true }, (error, zip) =>
      error ? reject(invalid(error.message)) : resolve(zip),
    ),
  );

const openEntry = (zip: ZipFile, entry: Entry) =>
  new Promise<NodeJS.ReadableStream>((resolve, reject) =>
    zip.openReadStream(entry, (error, stream) => (error ? reject(invalid(error.message)) : resolve(stream))),
  );

/** Записи архива по одной: следующая читается, когда предыдущая распакована. */
async function* entries(zip: ZipFile): AsyncGenerator<Entry> {
  for (;;) {
    const entry = await new Promise<Entry | null>((resolve, reject) => {
      const onEntry = (next: Entry) => done(next);
      const onEnd = () => done(null);
      const onError = (error: Error) => {
        cleanup();
        reject(invalid(error.message));
      };
      const cleanup = () => {
        zip.off("entry", onEntry);
        zip.off("end", onEnd);
        zip.off("error", onError);
      };
      const done = (next: Entry | null) => {
        cleanup();
        resolve(next);
      };
      zip.on("entry", onEntry);
      zip.on("end", onEnd);
      zip.on("error", onError);
      zip.readEntry();
    });
    if (!entry) return;
    yield entry;
  }
}
