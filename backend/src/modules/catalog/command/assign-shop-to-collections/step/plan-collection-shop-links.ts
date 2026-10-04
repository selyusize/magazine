import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { Container } from "@container/index";

import { FindCollectionShopsByIdsFetcher } from "../../../query/find-collection-shops-by-ids/fetcher";
import { FindShopByRefFetcher } from "../../../query/find-shop-by-ref/fetcher";
import { collectionShopError, findCollectionShopProblem } from "../../../service/collection-shop-rules";
import type { AssignShopToCollectionsCommand } from "../command";
import type { AssignedCollectionShopDTO } from "../dto";

/**
 * Только чтение: магазин по ссылке и связи, которых не хватает. Коллекция другого магазина или с чужими товарами —
 * 400 (`collection-shop-rules`); уже связанная с этим магазином — пропускается.
 */
export const planCollectionShopLinksStep = createStep(
  "plan-collection-shop-links",
  async (command: AssignShopToCollectionsCommand, { container }) => {
    const scope = Container.from(container);
    const shop = await scope.get(FindShopByRefFetcher).fetch({ shop: command.shop });
    if (!shop)
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Магазин ${JSON.stringify(command.shop)} не найден`);

    const collections = await scope
      .get(FindCollectionShopsByIdsFetcher)
      .fetch({ collection_ids: command.collection_ids });
    const missing = command.collection_ids.filter((id) => !collections.some((collection) => collection.id === id));
    if (missing.length)
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Коллекция ${missing.join(", ")} не найдена`);

    const problems = collections.flatMap((collection) => {
      const problem = findCollectionShopProblem(collection, shop.id);
      return problem ? [{ title: collection.title, problem }] : [];
    });
    if (problems.length) throw collectionShopError(problems);

    const links: AssignedCollectionShopDTO[] = collections
      .filter((collection) => collection.shop_id === null)
      .map((collection) => ({ collection_id: collection.id, shop_id: shop.id }));
    return new StepResponse(links);
  },
);
