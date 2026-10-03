import { createHash } from "node:crypto";
import path from "node:path";

import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { Container } from "@container/index";
import { Downloader } from "@shared/service/download/downloader";
import { PackageStorage } from "@shared/service/package-storage/package-storage";

import { EXCHANGE_MODULE } from "../index";
import type { ExchangeModuleService } from "../service/exchange-module-service";
import { errorMessage } from "@shared/service/error/error-message";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const isURL = (source: string) => /^https?:\/\//i.test(source);

export type EnsuredImages = {
  /** Источник из выгрузки → URL картинки у нас. Нет в словаре — картинку получить не удалось. */
  urls: Record<string, string>;
  failed: { source: string; message: string }[];
};

/**
 * Картинки товаров поставщика у нас (без хотлинка): источник уже скачан — берём сохранённый URL; содержимое уже
 * есть (тот же sha256 у другого источника или поставщика) — новый источник указывает на тот же файл без повторной
 * загрузки и ресайза; иначе — загрузка через файловый модуль (копии для srcset делает провайдер, этап 1.5).
 * Битая или недоступная картинка не валит пачку — уходит в `failed`. Откат удаляет загруженные файлы и записи.
 */
export const ensureExchangeImagesStep = createStep(
  "ensure-exchange-images",
  async (input: { supplier_id: string; package_dir: string; sources: string[] }, { container }) => {
    const result: EnsuredImages = { urls: {}, failed: [] };
    const undo: { rows: string[]; files: string[] } = { rows: [], files: [] };
    const sources = [...new Set(input.sources.filter(Boolean))];
    if (!sources.length) return new StepResponse(result, undo);

    const exchange = container.resolve<ExchangeModuleService>(EXCHANGE_MODULE);
    const known = await exchange.listExchangeImages({ supplier_id: input.supplier_id, source: sources });
    for (const image of known) result.urls[image.source] = image.url;

    const app = Container.from(container);
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const files = container.resolve(Modules.FILE);
    const rows: { supplier_id: string; source: string; hash: string; url: string; file_id: string }[] = [];
    const uploaded = new Map<string, { url: string; file_id: string }>();

    for (const source of sources.filter((source) => !result.urls[source])) {
      try {
        const content = isURL(source)
          ? await app.get(Downloader).toBuffer({ url: source })
          : await readAll(app.get(PackageStorage).read(input.package_dir, source));
        const hash = createHash("sha256").update(content).digest("hex");

        let stored = uploaded.get(hash) ?? (await exchange.listExchangeImages({ hash }, { take: 1 }))[0];
        if (!stored) {
          const extension = path.extname(new URL(source, "file:///").pathname).toLowerCase();
          const [file] = await files.createFiles([
            {
              filename: `${hash.slice(0, 16)}${MIME[extension] ? extension : ".jpg"}`,
              mimeType: MIME[extension] ?? "image/jpeg",
              content: content.toString("base64"),
              access: "public",
            },
          ]);
          undo.files.push(file.id);
          stored = { url: file.url, file_id: file.id };
        }
        uploaded.set(hash, { url: stored.url, file_id: stored.file_id });
        rows.push({ supplier_id: input.supplier_id, source, hash, url: stored.url, file_id: stored.file_id });
        result.urls[source] = stored.url;
      } catch (error) {
        // Одна картинка не должна останавливать пачку: товар получит остальные, проблема — в лог запуска
        const message = errorMessage(error);
        logger.warn(`exchange/ensure-exchange-images: ${source}: ${message}`);
        result.failed.push({ source, message });
      }
    }

    if (rows.length) undo.rows = (await exchange.createExchangeImages(rows)).map((row) => row.id);
    return new StepResponse(result, undo);
  },
  async (undo, { container }) => {
    if (!undo) return;
    if (undo.rows.length) await container.resolve<ExchangeModuleService>(EXCHANGE_MODULE).deleteExchangeImages(undo.rows);
    if (undo.files.length) await container.resolve(Modules.FILE).deleteFiles(undo.files);
  },
);

async function readAll(stream: AsyncIterable<Buffer | string>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}
