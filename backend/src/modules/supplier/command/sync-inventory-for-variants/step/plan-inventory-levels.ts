import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import {
  type InventoryLevelsPlan,
  planInventoryLevels,
} from "../../../service/inventory-levels";
import type { SyncInventoryForVariantsCommand } from "../command";

/**
 * Только чтение: варианты с учётом остатков, их предложения, все поставщики (с удалёнными — их склады нужно
 * обнулить) и текущие уровни → что создать и изменить. Варианты без `manage_inventory` пропускаются: Medusa
 * не считает для них наличие.
 */
export const planInventoryLevelsStep = createStep(
  "plan-inventory-levels",
  async (command: SyncInventoryForVariantsCommand, { container }) => {
    const empty: InventoryLevelsPlan = { create: [], update: [] };
    const variantIds = [...new Set(command.variant_ids)];
    if (variantIds.length === 0) return new StepResponse(empty);

    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data: variantRows } = await query.graph({
      entity: "product_variant",
      fields: [
        "id",
        "manage_inventory",
        "inventory_items.inventory_item_id",
        "inventory_items.required_quantity",
      ],
      filters: { id: variantIds },
    });
    const variants = variantRows
      .filter((variant) => variant.manage_inventory)
      .map((variant) => ({
        id: variant.id,
        inventory_items: (variant.inventory_items ?? []).flatMap((item) =>
          item
            ? [
                {
                  inventory_item_id: item.inventory_item_id,
                  required_quantity: Number(item.required_quantity ?? 1),
                },
              ]
            : [],
        ),
      }));
    const itemIds = variants.flatMap((variant) =>
      variant.inventory_items.map((item) => item.inventory_item_id),
    );
    if (itemIds.length === 0) return new StepResponse(empty);

    const [{ data: offers }, { data: suppliers }, { data: levels }] =
      await Promise.all([
        query.graph({
          entity: "supplier_offer",
          fields: ["variant_id", "supplier_id", "quantity"],
          filters: { variant_id: variants.map((variant) => variant.id) },
        }),
        query.graph({
          entity: "supplier",
          fields: ["id", "is_active", "stock_location_id", "deleted_at"],
          withDeleted: true,
        }),
        query.graph({
          entity: "inventory_level",
          fields: [
            "id",
            "inventory_item_id",
            "location_id",
            "stocked_quantity",
          ],
          filters: { inventory_item_id: itemIds },
        }),
      ]);

    return new StepResponse(
      planInventoryLevels({
        variants,
        offers: offers.map((offer) => ({
          variant_id: offer.variant_id,
          supplier_id: offer.supplier_id,
          quantity: Number(offer.quantity),
        })),
        suppliers: suppliers.map((supplier) => ({
          id: supplier.id,
          stock_location_id: supplier.stock_location_id ?? null,
          is_selling: supplier.is_active && !supplier.deleted_at,
        })),
        levels: levels.map((level) => ({
          id: level.id,
          inventory_item_id: level.inventory_item_id,
          location_id: level.location_id,
          stocked_quantity: Number(level.stocked_quantity),
        })),
      }),
    );
  },
);
