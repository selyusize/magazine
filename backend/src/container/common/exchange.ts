import path from "node:path";

import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { define } from "@shared/container";
import { Downloader, type DownloaderOptions, HTTPTransport } from "@shared/service/download/downloader";
import { PackageStorage, type PackageStorageOptions } from "@shared/service/package-storage/package-storage";
import { ExchangeConfig, type ExchangeOptions } from "@domain/exchange/service/exchange-config";
import { ExchangeSession } from "@domain/exchange/service/exchange-session";
import { ZipExtractor, type ZipExtractorOptions } from "@shared/service/zip/zip-extractor";

const MB = 1024 * 1024;

/** Пакеты обмена: локально — backend/exchange, в Docker — /app/exchange (volume, общий для server и worker). */
export const packageStorageConfig: PackageStorageOptions = {
  dir: path.resolve(process.env.EXCHANGE_DIR || "exchange"),
};

/** Обмен с поставщиками (план, этап 4): протокол 1С, пачки импорта, зависшие запуски. */
export const exchangeConfig: ExchangeOptions & { session_ttl: number; session_secret: string } = {
  /** `file_limit` для 1С: больше за один запрос она не шлёт — режет файл на части. */
  file_limit: Number(process.env.EXCHANGE_FILE_LIMIT_MB || 50) * MB,
  /** Срок cookie сессии обмена после `checkauth`, с. */
  session_ttl: 60 * 60,
  /** Секрет подписи cookie сессии обмена; по умолчанию — COOKIE_SECRET Medusa. */
  session_secret: process.env.EXCHANGE_SECRET || process.env.COOKIE_SECRET || "",
  /** Товаров (или предложений) в одной пачке-транзакции импорта. */
  batch_size: Number(process.env.EXCHANGE_BATCH_SIZE || 100),
  /** Запуск без отметки дольше этого — завис (упал worker): job подхватит его с места остановки, мин. */
  stalled_after_minutes: 15,
};

export const zipConfig: ZipExtractorOptions = {
  max_bytes: Number(process.env.EXCHANGE_MAX_PACKAGE_MB || 2048) * MB,
};

export const downloaderConfig: DownloaderOptions = {
  max_bytes: Number(process.env.EXCHANGE_MAX_PACKAGE_MB || 2048) * MB,
  timeout_ms: Number(process.env.EXCHANGE_DOWNLOAD_TIMEOUT_S || 600) * 1000,
};

export default [
  define(ExchangeConfig, () => new ExchangeConfig(exchangeConfig)),
  define(PackageStorage, () => new PackageStorage(packageStorageConfig)),
  define(ZipExtractor, () => new ZipExtractor(zipConfig)),
  define(
    ExchangeSession,
    () => new ExchangeSession({ secret: exchangeConfig.session_secret }, exchangeConfig.session_ttl),
  ),
  define(
    Downloader,
    ({ container }) =>
      new Downloader(downloaderConfig, [new HTTPTransport()], container.resolve(ContainerRegistrationKeys.LOGGER)),
  ),
];
