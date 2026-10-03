import { define } from "@shared/container";
import {
  ImageResizer,
  type ImageResizerOptions,
} from "@shared/service/image/image-resizer";

/**
 * Копии фото для srcset. Те же настройки получает файловый провайдер (medusa-config.ts) —
 * поменяли ширины или форматы, перегенерируйте старые файлы: `pnpm images:resize`.
 * Ширины совпадают с `images.deviceSizes`/`imageSizes` на фронте.
 */
export const imageConfig: ImageResizerOptions = {
  widths: [160, 320, 480, 640, 960, 1280, 1920],
  formats: ["webp"],
  quality: 80,
};

export default [define(ImageResizer, () => new ImageResizer(imageConfig))];
