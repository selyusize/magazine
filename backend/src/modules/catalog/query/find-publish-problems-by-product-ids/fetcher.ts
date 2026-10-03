import { ProductStatus } from "@medusajs/framework/utils";

import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { Injectable } from "@shared/container";

import { findMissingRequirements } from "../../service/publish-requirements";
import type { PublishProblemDTO } from "./dto";
import type { FindPublishProblemsByProductIdsQuery } from "./query";

type ProductRow = {
  id: string;
  title: string | null;
  handle: string | null;
  thumbnail: string | null;
  images?: ({ id: string } | null)[] | null;
  product_main_category?: { category_id: string } | null;
  variants?:
    | ({
        prices?: ({ amount: number | string | null } | null)[] | null;
        supplier_offers?: ({ id: string } | null)[] | null;
      } | null)[]
    | null;
};

const toPublishProblemDTO = (product: ProductRow): PublishProblemDTO => {
  const variants = (product.variants ?? []).filter((v) => v !== null);
  return {
    product_id: product.id,
    title: product.title || product.id,
    missing: findMissingRequirements({
      title: product.title,
      handle: product.handle,
      has_main_category: !!product.product_main_category?.category_id,
      has_image: !!product.thumbnail || !!product.images?.some(Boolean),
      has_price: variants.some((variant) =>
        variant.prices?.some((price) => price && Number(price.amount) > 0),
      ),
      has_offer: variants.some((variant) =>
        variant.supplier_offers?.some(Boolean),
      ),
    }),
  };
};

/**
 * Опубликованные товары из списка, которым не хватает обязательных полей (title, handle, основная категория,
 * изображение, цена, предложение поставщика). Черновики не проверяются. Всё в порядке — пустой массив.
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
      filters: { id: query.product_ids, status: ProductStatus.PUBLISHED },
    });
    return (data as ProductRow[])
      .map(toPublishProblemDTO)
      .filter((problem) => problem.missing.length > 0);
  }
}
