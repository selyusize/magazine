import type { URLEntityType } from "../../service/path";

/** Сущность удалена — закрыть её страницу на витрине. */
export type CloseEntityURLCommand = {
  entity_type: URLEntityType;
  entity_id: string;
};
