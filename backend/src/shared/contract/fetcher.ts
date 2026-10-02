import type { DTO } from "./dto";
import type { Query } from "./query";

/** Фетчер: принимает Query, возвращает DTO, массив DTO или null. */
export interface Fetcher<TQuery extends Query, TResult extends DTO | DTO[] | null> {
  fetch(query: TQuery): Promise<TResult>;
}
