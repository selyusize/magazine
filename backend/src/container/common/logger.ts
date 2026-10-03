import path from "node:path";

import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { define } from "@shared/container";
import { Logger, type LoggerOptions } from "@shared/service/logger/logger";

/** Локально — backend/logs, в Docker — /app/logs (volume, общий для server и worker). */
export const loggerConfig: LoggerOptions = {
  dir: path.resolve(process.env.LOGS_DIR || "logs"),
};

export default [
  define(
    Logger,
    ({ container }) =>
      new Logger(
        loggerConfig,
        container.resolve(ContainerRegistrationKeys.LOGGER),
      ),
  ),
];
