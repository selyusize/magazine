import type { Definition } from "@shared/container";
import cache from "./common/cache";
import cors from "./common/cors";
import delivery from "./common/delivery";
import exchange from "./common/exchange";
import image from "./common/image";
import logger from "./common/logger";
import shop from "./common/shop";
import smtp from "./common/smtp";

/** Определения всех модулей. Новый модуль — новый файл в ./common и строка здесь. */
export const dependencies: Definition<unknown>[] = [
  ...cache,
  ...cors,
  ...delivery,
  ...exchange,
  ...image,
  ...logger,
  ...shop,
  ...smtp,
];
