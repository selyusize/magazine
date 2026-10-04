import type { JSONValue } from "@shared/contract/command";

/** Событие изменения сущности из реестра инвалидации. */
export type InvalidateCachesByEventCommand = {
  event: string;
  data: JSONValue;
};
