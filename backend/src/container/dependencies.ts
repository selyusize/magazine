import type { Definition } from "@shared/container";
import delivery from "./common/delivery";
import image from "./common/image";
import logger from "./common/logger";
import smtp from "./common/smtp";

/** Определения всех модулей. Новый модуль — новый файл в ./common и строка здесь. */
export const dependencies: Definition<unknown>[] = [
  ...delivery,
  ...image,
  ...logger,
  ...smtp,
];
