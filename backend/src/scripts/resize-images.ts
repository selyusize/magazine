/**
 * Досоздаёт уменьшенные копии для картинок, загруженных до ресайза или до смены ширин/форматов
 * в src/container/common/image.ts. Новые загрузки режет файловый провайдер сам.
 *
 *   pnpm images:resize
 *
 * Повторный запуск пропускает картинки, у которых все копии уже есть. Лог — logs/images-resize.log.
 */
import type { Dirent } from "node:fs";
import { access, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ExecArgs } from "@medusajs/framework/types";

import { Container } from "@container/index";
import { ImageResizer } from "@shared/service/image/image-resizer";
import { Logger } from "@shared/service/logger/logger";

const STATIC_DIR = path.resolve("static");

export default async function resizeImages({
  container,
}: ExecArgs): Promise<void> {
  const scope = Container.from(container);
  const resizer = scope.get(ImageResizer);
  const logger = scope.get(Logger).toFile("images-resize");

  const keys = (await listFiles(STATIC_DIR)).filter(
    (key) => !key.startsWith("private-") && resizer.isResizable(key),
  );
  let resized = 0;
  let failed = 0;

  for (const key of keys) {
    if (await allExist(resizer.variantKeys(key))) continue;

    try {
      const variants = await resizer.resize(
        key,
        await readFile(path.join(STATIC_DIR, key)),
      );
      await Promise.all(
        variants.map((variant) =>
          writeFile(path.join(STATIC_DIR, variant.key), variant.content),
        ),
      );
      resized++;
    } catch (error) {
      failed++;
      logger.warn(
        `images/resize: ${key} пропущен: ${(error as Error).message}`,
      );
    }
  }

  logger.info(
    `images/resize: картинок ${keys.length}, нарезано ${resized}, ошибок ${failed}`,
  );
  await logger.flush();
}

/** Ключи файлов относительно static, включая подпапки */
async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, {
    recursive: true,
    withFileTypes: true,
  }).catch((): Dirent[] => []);
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(dir, path.join(entry.parentPath, entry.name)),
    );
}

async function allExist(keys: string[]): Promise<boolean> {
  const results = await Promise.all(
    keys.map((key) =>
      access(path.join(STATIC_DIR, key)).then(
        () => true,
        () => false,
      ),
    ),
  );
  return results.every(Boolean);
}
