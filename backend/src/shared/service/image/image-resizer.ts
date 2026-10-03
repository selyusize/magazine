import path from "node:path";

import { MedusaError } from "@medusajs/framework/utils";
import sharp from "sharp";

export type ImageFormat = "webp" | "avif";

export type ImageResizerOptions = {
  /** Ширины уменьшенных копий в px. Меньший исходник не растягивается — файл всё равно создаётся */
  widths: number[];
  /** Форматы копий: webp понимают все браузеры, avif легче, но кодируется в разы дольше */
  formats: ImageFormat[];
  /** Качество 1–100 */
  quality: number;
};

export type ImageVariant = {
  width: number;
  format: ImageFormat;
  /** Ключ файла копии рядом с оригиналом: `photo.jpg` → `photo.w640.webp` */
  key: string;
  content: Buffer;
};

/** Растровые форматы, которые режем; svg, gif (анимация) и прочее остаются как есть */
const RESIZABLE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".tif",
  ".tiff",
  ".heic",
  ".heif",
]);

/** Копия, созданная ресайзом: `photo.w640.webp` */
const VARIANT_KEY = /\.w\d+\.(webp|avif)$/;

/**
 * Уменьшенные копии изображений для srcset: автоповорот по EXIF, без метаданных (EXIF, GPS), без увеличения.
 * Копия лежит рядом с оригиналом, ключ выводится из ключа оригинала — фронт строит URL копии сам.
 * Собирается в src/container/common/image.ts; файловый провайдер src/modules/file-local-resize создаёт его из options.
 */
export class ImageResizer {
  constructor(private readonly options: ImageResizerOptions) {
    if (!options.widths.length || !options.formats.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Ресайз изображений: не заданы ширины или форматы",
      );
    }
  }

  /** Подходит ли файл для ресайза: растровая картинка и не копия от прошлого ресайза */
  isResizable(key: string): boolean {
    return (
      RESIZABLE_EXTENSIONS.has(path.extname(key).toLowerCase()) &&
      !VARIANT_KEY.test(key)
    );
  }

  /** Ключ копии: `products/123-photo.jpg` → `products/123-photo.w640.webp` */
  variantKey(key: string, width: number, format: ImageFormat): string {
    const parsed = path.parse(key);
    return path.join(parsed.dir, `${parsed.name}.w${width}.${format}`);
  }

  /** Ключи всех копий оригинала — для удаления вместе с ним */
  variantKeys(key: string): string[] {
    return this.options.widths.flatMap((width) =>
      this.options.formats.map((format) => this.variantKey(key, width, format)),
    );
  }

  /** Все копии оригинала по ширинам и форматам из настроек */
  async resize(key: string, content: Buffer): Promise<ImageVariant[]> {
    const source = sharp(content, { failOn: "error" }).rotate();

    return Promise.all(
      this.options.widths.flatMap((width) =>
        this.options.formats.map(async (format) => ({
          width,
          format,
          key: this.variantKey(key, width, format),
          content: await source
            .clone()
            .resize({ width, withoutEnlargement: true })
            .toFormat(format, { quality: this.options.quality })
            .toBuffer(),
        })),
      ),
    );
  }
}
