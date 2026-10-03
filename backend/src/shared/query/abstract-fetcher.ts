import type {
  ICachingModuleService,
  MedusaContainer,
} from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import type { z } from "@medusajs/framework/zod";

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
   * Значение из кэша проверяется `schema`: не подошло (формат поменялся с прошлой версии) — загружается заново.
   */
  protected async cached<S extends z.ZodType<object>>(
    key: string,
    ttl: number,
    schema: S,
    load: () => Promise<z.infer<S>>,
  ): Promise<z.infer<S>> {
    const cache = this.container.resolve<ICachingModuleService | undefined>(
      Modules.CACHING,
      {
        allowUnregistered: true,
      },
    );
    if (!cache) return load();

    const hit = schema.safeParse(await cache.get({ key }));
    if (hit.success) return hit.data;

    const data = await load();
    await cache.set({ key, data, ttl });
    return data;
  }

  abstract fetch(query: TQuery): Promise<TResult>;
}
