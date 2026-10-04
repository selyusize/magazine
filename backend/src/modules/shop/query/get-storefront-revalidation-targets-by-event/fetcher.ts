import type { MedusaContainer } from "@medusajs/framework/types";

import { Injectable, InjectContainer } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { isString, records, text } from "@shared/query/narrow";
import {
  CacheInvalidationRegistry,
  eventValues,
  type StorefrontTarget,
} from "@shared/service/cache-invalidation/cache-invalidator";

import { groupBatchesByShop } from "../../service/storefront-revalidation";
import type { StorefrontRevalidationTargetDTO } from "./dto";
import type { GetStorefrontRevalidationTargetsByEventQuery } from "./query";

/**
 * Витрины, которым событие делает кэш устаревшим, — по реестру `src/container/common/cache.ts`: сущность события →
 * её магазин и теги; удалённая или «без магазина» сущность и сетевые события — все активные магазины.
 */
@Injectable()
export class GetStorefrontRevalidationTargetsByEventFetcher extends AbstractFetcher<
  GetStorefrontRevalidationTargetsByEventQuery,
  StorefrontRevalidationTargetDTO[]
> {
  private activeShopIds: Promise<string[]> | null = null;

  constructor(
    @InjectContainer() container: MedusaContainer,
    private readonly registry: CacheInvalidationRegistry,
  ) {
    super(container);
  }

  async fetch(query: GetStorefrontRevalidationTargetsByEventQuery): Promise<StorefrontRevalidationTargetDTO[]> {
    const targets = this.registry.storefrontTargets(query.event);
    const batches = await Promise.all(targets.map((target) => this.resolve(target, query.data)));
    return groupBatchesByShop(batches.flat());
  }

  private async resolve(target: StorefrontTarget, data: unknown): Promise<StorefrontRevalidationTargetDTO[]> {
    if (target.scope === "network") return this.toAllShops(target.tags);
    if (target.scope === "shop") {
      return eventValues(data, target.field).map((shop_id) => ({ shop_id, tags: target.tags }));
    }

    const ids = eventValues(data, "id");
    if (ids.length === 0) return [];
    const { data: rows } = await this.graph({ entity: target.entity, fields: target.fields, filters: { id: ids } });

    const resolved = new Set<string>();
    const batches = records(rows).flatMap((row) => {
      const shop_id = target.shopOf(row);
      if (!shop_id) return [];
      resolved.add(text(row.id));
      return [{ shop_id, tags: target.tags(row) }];
    });
    const orphans = ids.some((id) => !resolved.has(id));
    return orphans ? [...batches, ...(await this.toAllShops(target.orphan_tags))] : batches;
  }

  private async toAllShops(tags: string[]): Promise<StorefrontRevalidationTargetDTO[]> {
    const shopIds = (this.activeShopIds ??= this.graph({
      entity: "shop",
      fields: ["id"],
      filters: { is_active: true },
    }).then(({ data }) => records(data).flatMap((row) => (isString(row.id) ? [row.id] : []))));
    return (await shopIds).map((shop_id) => ({ shop_id, tags }));
  }
}
