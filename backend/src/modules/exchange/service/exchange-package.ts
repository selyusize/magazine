import { Readable } from "node:stream";

import { Injectable } from "@shared/container";
import { PackageStorage } from "@shared/service/package-storage/package-storage";
import { ZipExtractor } from "@shared/service/zip/zip-extractor";

import { orderPackageFiles } from "./package-files";

/** Пометка рядом с архивом: уже распакован — продолжение запуска не распаковывает его заново. */
const EXTRACTED = ".extracted";

/**
 * Пакет обмена на диске: архивы распаковываются в папку запуска (сами архивы остаются — для разбора споров о
 * ценах, этап 19), XML-файлы отдаются в порядке обработки.
 */
@Injectable()
export class ExchangePackage {
  constructor(
    private readonly storage: PackageStorage,
    private readonly zip: ZipExtractor,
  ) {}

  async prepare(dir: string): Promise<string[]> {
    const files = await this.storage.list(dir);
    for (const archive of files.filter((file) => file.toLowerCase().endsWith(".zip"))) {
      if (files.includes(archive + EXTRACTED)) continue;
      await this.zip.extract(this.storage.resolve(dir, archive), this.storage.resolve(dir));
      await this.storage.append(dir, archive + EXTRACTED, Readable.from([]), 0);
    }
    return orderPackageFiles(await this.storage.list(dir));
  }

  open(dir: string, file: string): Readable {
    return this.storage.read(dir, file);
  }
}
