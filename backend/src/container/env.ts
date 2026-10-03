import { loadEnv } from "@medusajs/framework/utils";

/**
 * `.env` до чтения конфигов из ./common: medusa-config.ts импортирует этот модуль первым —
 * импорты выполняются по порядку, и конфиги ниже уже видят переменные.
 */
loadEnv(process.env.NODE_ENV || "development", process.cwd());
