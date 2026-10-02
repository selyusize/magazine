import type { JSONValue } from "./command";

/** Запрос — DTO на чтение данных. */
export type Query = { readonly [key: string]: JSONValue };
