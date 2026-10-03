import type { URLEntityType } from "../../service/path";

/** Сущность создана или изменена — привести handle к slug и отследить смену пути. */
export type SyncEntityURLCommand = {
  entity_type: URLEntityType;
  entity_id: string;
};
