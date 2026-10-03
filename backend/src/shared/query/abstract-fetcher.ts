import type {
  ICachingModuleService,
  MedusaContainer,
} from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

import type { DTO } from "../contract/dto";
import type { Fetcher } from "../contract/fetcher";
import type { Query } from "../contract/query";
import { Injectable, InjectContainer } from "../container/injectable";

/** Фетчер: только чтение через Query Medusa (graph). */
@Injectable()
export abstract class AbstractFetcher<
  TQuery extends Query,
  TResult extends DTO | DTO[] | null,
> implements Fetcher<TQuery, TResult> {
  constructor(
    @InjectContainer() protected readonly container: MedusaContainer,
  ) {}

  /** Query Medusa: чтение своих сущностей, сущностей Medusa и связей между ними. */
  protected get graph() {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY);
    return query.graph.bind(query);
  }

  /**
   * Данные внешних API (ПВЗ перевозчиков, справочники) — из кэша Medusa в Redis, иначе `load()` и в кэш на `ttl` секунд.
   * Без Redis модуля кэша нет — всегда `load()`. Данные своих сущностей кэшируем через `graph(..., { cache })`.
   */
  protected async cached<T extends object>(
    key: string,
    ttl: number,
    load: () => Promise<T>,
  ): Promise<T> {
    const cache = this.container.resolve<ICachingModuleService | undefined>(
      Modules.CACHING,
      {
        allowUnregistered: true,
      },
    );
    if (!cache) return load();

    const hit = (await cache.get({ key })) as T | null;
    if (hit) return hit;

    const data = await load();
    await cache.set({ key, data, ttl });
    return data;
  }

  abstract fetch(query: TQuery): Promise<TResult>;
}
