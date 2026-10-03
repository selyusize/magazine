import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { recordOf, recordOrNull, textOrNull } from "@shared/query/narrow";

import type { UpdateCatalogForProductCommand } from "../command";

const notFound = (what: string) =>
  new MedusaError(MedusaError.Types.NOT_FOUND, what);

/** Что меняем: `undefined` — поле не трогаем. */
export type ProductCatalogChange = {
  product_id: string;
  brand?: { previous: string | null; next: string | null };
  main_category_id?: string | null;
};

/** Только чтение: товар, бренд и категория существуют; текущий бренд — чтобы снять старую связь. */
export const validateProductCatalogStep = createStep(
  "validate-product-catalog",
  async (command: UpdateCatalogForProductCommand, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "brand.id"],
      filters: { id: command.product_id },
    });
    const product = products[0];
    if (!product) throw notFound(`Товар ${command.product_id} не найден`);

    if (command.brand_id) {
      const { data } = await query.graph({
        entity: "brand",
        fields: ["id"],
        filters: { id: command.brand_id },
      });
      if (!data.length) throw notFound(`Бренд ${command.brand_id} не найден`);
    }
    if (command.main_category_id) {
      const { data } = await query.graph({
        entity: "product_category",
        fields: ["id"],
        filters: { id: command.main_category_id },
      });
      if (!data.length)
        throw notFound(`Категория ${command.main_category_id} не найдена`);
    }

    const previousBrand = textOrNull(recordOrNull(recordOf(product).brand)?.id);
    const change: ProductCatalogChange = {
      product_id: product.id,
      brand:
        command.brand_id === undefined || command.brand_id === previousBrand
          ? undefined
          : { previous: previousBrand, next: command.brand_id },
      main_category_id: command.main_category_id,
    };
    return new StepResponse(change);
  },
);
