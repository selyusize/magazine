import { ProductStatus } from "@medusajs/framework/utils";

import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { Injectable } from "@shared/container";

import { numberOr, recordOf, recordOrNull, records, text, textOrNull } from "@shared/query/narrow";

import { findMissingRequirements } from "../../service/publish-requirements";
import type { PublishProblemDTO } from "./dto";
import type { FindPublishProblemsByProductIdsQuery } from "./query";

const toPublishProblemDTO = (value: unknown): PublishProblemDTO => {
  const product = recordOf(value);
  const id = text(product.id);
  const title = textOrNull(product.title);
  const variants = records(product.variants);
  return {
    product_id: id,
    title: title || id,
    missing: findMissingRequirements({
      title,
      handle: textOrNull(product.handle),
      has_main_category: Boolean(textOrNull(recordOrNull(product.product_main_category)?.category_id)),
      has_image: Boolean(textOrNull(product.thumbnail)) || records(product.images).length > 0,
      has_price: variants.some((variant) => records(variant.prices).some((price) => numberOr(price.amount) > 0)),
      has_offer: variants.some((variant) => records(variant.supplier_offers).length > 0),
    }),
  };
};

/**
 * Опубликованные товары из списка, которым не хватает обязательных полей (title, handle, основная категория,
 * изображение, цена, предложение поставщика). Черновики — только с `include_drafts`. Всё в порядке — пустой массив.
 */
@Injectable()
export class FindPublishProblemsByProductIdsFetcher extends AbstractFetcher<
  FindPublishProblemsByProductIdsQuery,
  PublishProblemDTO[]
> {
  async fetch(
    query: FindPublishProblemsByProductIdsQuery,
  ): Promise<PublishProblemDTO[]> {
    if (!query.product_ids.length) return [];

    const { data } = await this.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "thumbnail",
        "images.id",
        "product_main_category.category_id",
        "variants.prices.amount",
        "variants.supplier_offers.id",
      ],
      filters: query.include_drafts
        ? { id: query.product_ids }
        : { id: query.product_ids, status: ProductStatus.PUBLISHED },
    });
    return data
      .map(toPublishProblemDTO)
      .filter((problem) => problem.missing.length > 0);
  }
}
