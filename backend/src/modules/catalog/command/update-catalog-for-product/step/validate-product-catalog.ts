import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { recordOf, recordOrNull, textOrNull } from "@shared/query/narrow";
import { categoryShopId, CATEGORY_SHOP_FIELDS, foreignShopError, PRODUCT_SHOP_FIELDS, toProductShop } from "@shared/shop/catalog-shop";

import type { UpdateCatalogForProductCommand } from "../command";

const notFound = (what: string) =>
  new MedusaError(MedusaError.Types.NOT_FOUND, what);

/** Что меняем: `undefined` — поле не трогаем. */
export type ProductCatalogChange = {
  product_id: string;
  brand?: { previous: string | null; next: string | null };
  main_category_id?: string | null;
};

/**
 * Только чтение: товар, бренд и категория существуют и бренд с категорией — из магазина товара (чужой — 400);
 * текущий бренд — чтобы снять старую связь.
 */
export const validateProductCatalogStep = createStep(
  "validate-product-catalog",
  async (command: UpdateCatalogForProductCommand, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "brand.id", ...PRODUCT_SHOP_FIELDS],
      filters: { id: command.product_id },
    });
    const product = products[0];
    if (!product) throw notFound(`Товар ${command.product_id} не найден`);
    const shopId = toProductShop(product).shop_id;

    if (command.brand_id) {
      const { data } = await query.graph({
        entity: "brand",
        fields: ["id", "name", "shop_id"],
        filters: { id: command.brand_id },
      });
      const [brand] = data;
      if (!brand) throw notFound(`Бренд ${command.brand_id} не найден`);
      if (brand.shop_id !== shopId) throw foreignShopError(`Бренд «${brand.name}»`);
    }
    if (command.main_category_id) {
      const { data } = await query.graph({
        entity: "product_category",
        fields: ["id", "name", ...CATEGORY_SHOP_FIELDS],
        filters: { id: command.main_category_id },
      });
      const [category] = data;
      if (!category)
        throw notFound(`Категория ${command.main_category_id} не найдена`);
      if (categoryShopId(category) !== shopId)
        throw foreignShopError(`Категория «${category.name}»`);
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
