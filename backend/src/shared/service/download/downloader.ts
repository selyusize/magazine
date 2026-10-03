import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import type { Logger } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import { errorMessage } from "@shared/service/error/error-message";

/** Откуда скачать: адрес и, если источник закрыт, логин и пароль (Basic для HTTP). */
export type DownloadRequest = {
  url: string;
  login?: string | null;
  password?: string | null;
};

export type DownloaderOptions = {
  /** Предел размера одного файла, байт. */
  max_bytes: number;
  /** Сколько ждать ответа и данных, мс. */
  timeout_ms: number;
};

/**
 * Протокол доставки файла (HTTP, FTP, SFTP…): открывает поток с содержимым. Новый протокол — новый транспорт
 * в src/container/common/exchange.ts, остальной код не меняется.
 */
export abstract class DownloadTransport {
  abstract supports(protocol: string): boolean;
  abstract open(request: DownloadRequest, options: DownloaderOptions): Promise<Readable>;
}

/** HTTP(S) через встроенный fetch: Basic-авторизация, таймаут, ошибка статуса — понятным текстом. */
export class HTTPTransport extends DownloadTransport {
  supports(protocol: string): boolean {
    return protocol === "http:" || protocol === "https:";
  }

  async open(request: DownloadRequest, options: DownloaderOptions): Promise<Readable> {
    const headers: Record<string, string> = {};
    if (request.login)
      headers.authorization = `Basic ${Buffer.from(`${request.login}:${request.password ?? ""}`).toString("base64")}`;

    const response = await fetch(request.url, {
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(options.timeout_ms),
    });
    if (!response.ok || !response.body)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `HTTP ${response.status} ${response.statusText}`.trim());
    return Readable.from(chunksOf(response.body));
  }
}

/** Тело fetch кусками: web-поток DOM и Node типизированы по-разному, читаем его сами. */
async function* chunksOf(body: ReadableStream<Uint8Array>): AsyncGenerator<Uint8Array> {
  const reader = body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Скачивание выгрузок и картинок поставщиков: на диск потоком (`toFile`) или в память (`toBuffer`, для картинок).
 * Протокол выбирается по адресу из списка транспортов. Ошибка источника логируется и превращается в
 * `UNEXPECTED_STATE` с адресом — он попадает в лог запуска импорта.
 */
export class Downloader {
  constructor(
    private readonly options: DownloaderOptions,
    private readonly transports: DownloadTransport[],
    private readonly logger: Logger,
  ) {}

  async toFile(request: DownloadRequest, destination: string): Promise<void> {
    await mkdir(path.dirname(destination), { recursive: true });
    await this.run(request, async (stream) => {
      await pipeline(stream, this.limit(request.url), createWriteStream(destination));
    });
  }

  async toBuffer(request: DownloadRequest): Promise<Buffer> {
    let result = Buffer.alloc(0);
    await this.run(request, async (stream) => {
      const parts: Buffer[] = [];
      for await (const chunk of stream.pipe(this.limit(request.url)))
        parts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      result = Buffer.concat(parts);
    });
    return result;
  }

  private async run(request: DownloadRequest, consume: (stream: Readable) => Promise<void>): Promise<void> {
    const transport = this.transportFor(request.url);
    try {
      await consume(await transport.open(request, this.options));
    } catch (error) {
      // Превышение размера — ошибка данных как есть; сбой источника — с адресом, по которому он случился
      if (error instanceof MedusaError && error.type === MedusaError.Types.INVALID_DATA) throw error;
      const message = `Не удалось скачать ${request.url}: ${errorMessage(error)}`;
      this.logger.warn(`download: ${message}`);
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message);
    }
  }

  private transportFor(url: string): DownloadTransport {
    let protocol: string;
    try {
      protocol = new URL(url).protocol;
    } catch {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Некорректный адрес «${url}»`);
    }
    const transport = this.transports.find((candidate) => candidate.supports(protocol));
    if (!transport)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Протокол ${protocol.replace(/:$/, "")} не поддерживается (${url})`,
      );
    return transport;
  }

  /** Обрывает загрузку больше `max_bytes` — сервер может не прислать Content-Length или соврать в нём. */
  private limit(url: string): Transform {
    const max = this.options.max_bytes;
    let total = 0;
    return new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        total += chunk.length;
        if (total > max)
          callback(new MedusaError(MedusaError.Types.INVALID_DATA, `Файл ${url} больше ${max} байт`));
        else callback(null, chunk);
      },
    });
  }
}
