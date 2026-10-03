import { writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  FileTypes,
  Logger,
  LocalFileServiceOptions,
} from "@medusajs/framework/types";
import { LocalFileService } from "@medusajs/medusa/file-local";

import {
  ImageResizer,
  type ImageResizerOptions,
} from "@shared/service/image/image-resizer";

export type LocalResizeFileServiceOptions = LocalFileServiceOptions & {
  image: ImageResizerOptions;
};

/**
 * Локальное хранилище Medusa (папка static), которое после загрузки публичного изображения кладёт рядом
 * его уменьшенные копии (`photo.jpg` → `photo.w640.webp`) и удаляет их вместе с оригиналом.
 * Ресайз идёт до ответа на загрузку: URL из ответа сразу можно отдавать с srcset.
 */
export class LocalResizeFileService extends LocalFileService {
  static identifier = "local-resize";

  private readonly resizer: ImageResizer;
  private readonly logger: Logger;

  constructor(
    { logger }: { logger: Logger },
    options: LocalResizeFileServiceOptions,
  ) {
    super({}, options);
    this.resizer = new ImageResizer(options.image);
    this.logger = logger;
  }

  async upload(
    file: FileTypes.ProviderUploadFileDTO,
  ): Promise<FileTypes.ProviderFileResultDTO> {
    const result = await super.upload(file);
    if (file.access !== "private") await this.writeVariants(result.key);
    return result;
  }

  async getUploadStream(fileData: FileTypes.ProviderUploadStreamDTO) {
    const upload = await super.getUploadStream(fileData);
    if (fileData.access === "private") return upload;

    return {
      ...upload,
      promise: upload.promise.then(async (result) => {
        await this.writeVariants(result.key);
        return result;
      }),
    };
  }

  async delete(
    files: FileTypes.ProviderDeleteFileDTO | FileTypes.ProviderDeleteFileDTO[],
  ): Promise<void> {
    const originals = Array.isArray(files) ? files : [files];
    const variants = originals
      .filter((file) => this.resizer.isResizable(file.fileKey))
      .flatMap((file) =>
        this.resizer
          .variantKeys(file.fileKey)
          .map((fileKey) => ({ ...file, fileKey })),
      );

    // Отсутствующие файлы file-local пропускает — копий старых загрузок может и не быть
    await super.delete([...originals, ...variants]);
  }

  /** Битая картинка или неизвестный формат не ломают загрузку: оригинал сохранён, фронт откатится на него */
  private async writeVariants(key: string): Promise<void> {
    if (!this.resizer.isResizable(key)) return;

    try {
      const content = await this.getAsBuffer({ fileKey: key });
      const variants = await this.resizer.resize(key, content);
      await Promise.all(
        variants.map((variant) =>
          writeFile(path.join(this.uploadDir_, variant.key), variant.content),
        ),
      );
    } catch (error) {
      this.logger.warn(
        `file-local-resize/upload: не удалось сделать копии ${key}: ${(error as Error).message}`,
      );
    }
  }
}
