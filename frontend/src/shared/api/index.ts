export { cacheTags } from "./cache-tags";
export { ApiError, http } from "./http";
export { getQueryClient } from "./query-client";

// Сгенерировано Orval (`pnpm api:generate`): fetch-функции, хуки, query options и типы
export * from "./generated/endpoints";
export * from "./generated/schemas";

// Имена полей бэкенда ↔ фронта — для ключей, которые приходят данными (фасеты поиска)
export { camelToSnake } from "./case";
