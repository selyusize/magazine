import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { foreignShopError, PRODUCT_SHOP_FIELDS, toProductShop } from "@shared/shop/catalog-shop";

import { normalizeAttributeValue, toAttributeRef } from "../../../service/attribute-value";
import type { SetAttributeValuesForProductCommand } from "../command";

export type AttributeValueRow = {
  attribute_id: string;
  product_id: string;
  variant_id: string | null;
  value: string;
  handle: string;
  number: number | null;
};

/**
 * Только чтение: товар и вариант существуют (вариант — этого товара), характеристики существуют и они из магазина
 * товара (чужая — 400); значения приведены к типу характеристики, пустые и повторы отброшены.
 */
export const buildAttributeValuesStep = createStep(
  "build-attribute-values",
  async (command: SetAttributeValuesForProductCommand, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "variants.id", ...PRODUCT_SHOP_FIELDS],
      filters: { id: command.product_id },
    });
    const product = products[0];
    if (!product)
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Товар ${command.product_id} не найден`,
      );
    if (
      command.variant_id &&
      !product.variants?.some((variant) => variant?.id === command.variant_id)
    )
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Вариант ${command.variant_id} не относится к товару ${command.product_id}`,
      );

    const attributeIds = [
      ...new Set(command.values.map((v) => v.attribute_id)),
    ];
    const { data: attributes } = attributeIds.length
      ? await query.graph({
          entity: "attribute",
          fields: ["id", "name", "type", "shop_id"],
          filters: { id: attributeIds },
        })
      : { data: [] };
    const shopId = toProductShop(product).shop_id;
    const foreign = attributes.find((attribute) => attribute.shop_id !== shopId);
    if (foreign) throw foreignShopError(`Характеристика «${foreign.name}»`);
    const byId = new Map(attributes.map(toAttributeRef).map((attribute) => [attribute.id, attribute]));
    const missing = attributeIds.find((id) => !byId.has(id));
    if (missing)
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Характеристика ${missing} не найдена`,
      );

    const rows = new Map<string, AttributeValueRow>();
    for (const input of command.values) {
      const normalized = normalizeAttributeValue(
        byId.get(input.attribute_id)!,
        input.value,
      );
      if (!normalized) continue;
      rows.set(`${input.attribute_id}:${normalized.handle}`, {
        attribute_id: input.attribute_id,
        product_id: command.product_id,
        variant_id: command.variant_id,
        ...normalized,
      });
    }
    return new StepResponse([...rows.values()]);
  },
);
