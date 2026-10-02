import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import type { DTO } from "../contract/dto";
import type { Fetcher } from "../contract/fetcher";
import type { Query } from "../contract/query";
import { Injectable, InjectContainer } from "../container/injectable";

/** Фетчер: только чтение через Query Medusa (graph). */
@Injectable()
export abstract class AbstractFetcher<TQuery extends Query, TResult extends DTO | DTO[] | null>
  implements Fetcher<TQuery, TResult>
{
  constructor(@InjectContainer() protected readonly container: MedusaContainer) {}

  /** Query Medusa: чтение своих сущностей, сущностей Medusa и связей между ними. */
  protected get graph() {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY);
    return query.graph.bind(query);
  }

  abstract fetch(query: TQuery): Promise<TResult>;
}
