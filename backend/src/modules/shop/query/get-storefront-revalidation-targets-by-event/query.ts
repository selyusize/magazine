import type { JSONValue } from "@shared/contract/command";

/** Событие изменения из шины: имя и данные как пришли (`{ id }`, массив, `{ shop_id }`). */
export type GetStorefrontRevalidationTargetsByEventQuery = {
  event: string;
  data: JSONValue;
};
