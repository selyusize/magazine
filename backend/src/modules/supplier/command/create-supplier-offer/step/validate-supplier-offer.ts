import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { foreignShopError, PRODUCT_SHOP_FIELDS, toProductShop } from "@shared/shop/catalog-shop";

import type { CreateSupplierOfferCommand } from "../command";

/**
 * Только чтение: вариант и поставщик существуют, товар варианта — в магазине поставщика (чужой — 400). Вариант
 * живёт в другом модуле — внешнего ключа на него нет, поэтому проверка здесь; дубль `external_id` у поставщика
 * отсекает уникальный индекс.
 */
export const validateSupplierOfferStep = createStep(
  "validate-supplier-offer",
  async (command: CreateSupplierOfferCommand, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const [{ data: variants }, { data: suppliers }] = await Promise.all([
      query.graph({
        entity: "product_variant",
        fields: ["id", ...PRODUCT_SHOP_FIELDS.map((field) => `product.${field}`)],
        filters: { id: command.variant_id },
      }),
      query.graph({
        entity: "supplier",
        fields: ["id", "name", "shop_id"],
        filters: { id: command.supplier_id },
      }),
    ]);
    if (!variants.length)
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Вариант ${command.variant_id} не найден`,
      );
    if (!suppliers.length)
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Поставщик ${command.supplier_id} не найден`,
      );
    if (toProductShop(variants[0].product).shop_id !== suppliers[0].shop_id)
      throw foreignShopError(`Поставщик «${suppliers[0].name}»`);
    return new StepResponse(command);
  },
);
