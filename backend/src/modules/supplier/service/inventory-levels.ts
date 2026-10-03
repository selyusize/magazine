/** Вариант с учётом остатков: его inventory items (у набора их несколько, на единицу варианта — `required_quantity`). */
export type StockedVariant = {
  id: string;
  inventory_items: { inventory_item_id: string; required_quantity: number }[];
};

export type OfferStock = {
  variant_id: string;
  supplier_id: string;
  quantity: number;
};

/** Поставщик и его склад; `is_selling` — активен и не удалён. Удалённые нужны, чтобы обнулить их склады. */
export type SupplierStock = {
  id: string;
  stock_location_id: string | null;
  is_selling: boolean;
};

export type InventoryLevelRow = {
  id: string;
  inventory_item_id: string;
  location_id: string;
  stocked_quantity: number;
};

export type InventoryLevelsPlan = {
  create: {
    inventory_item_id: string;
    location_id: string;
    stocked_quantity: number;
  }[];
  update: {
    id: string;
    inventory_item_id: string;
    location_id: string;
    stocked_quantity: number;
  }[];
};

/**
 * Какие уровни inventory создать и изменить, чтобы на складе каждого поставщика лежала сумма остатков его
 * предложений по варианту. Наличие варианта Medusa считает суммой по складам канала продаж — получается сумма
 * остатков всех поставщиков. Склады выключенных и удалённых поставщиков обнуляются; уровни на чужих складах
 * (не поставщиков) не трогаем. Совпадающие значения не пишем — повторный запуск ничего не меняет.
 */
export function planInventoryLevels(input: {
  variants: StockedVariant[];
  offers: OfferStock[];
  suppliers: SupplierStock[];
  levels: InventoryLevelRow[];
}): InventoryLevelsPlan {
  const suppliers = new Map(input.suppliers.map((s) => [s.id, s]));
  const supplierLocations = new Set(
    input.suppliers.flatMap((s) =>
      s.stock_location_id ? [s.stock_location_id] : [],
    ),
  );

  /** inventory item → склад → сколько должно лежать. */
  const wanted = new Map<string, Map<string, number>>();
  const variants = new Map(input.variants.map((v) => [v.id, v]));
  for (const offer of input.offers) {
    const supplier = suppliers.get(offer.supplier_id);
    const variant = variants.get(offer.variant_id);
    if (!supplier?.is_selling || !supplier.stock_location_id || !variant)
      continue;

    for (const item of variant.inventory_items) {
      const byLocation =
        wanted.get(item.inventory_item_id) ?? new Map<string, number>();
      // Набор из 2 штук: 5 наборов у поставщика — 10 единиц на складе
      const quantity = Math.max(0, offer.quantity) * item.required_quantity;
      byLocation.set(
        supplier.stock_location_id,
        (byLocation.get(supplier.stock_location_id) ?? 0) + quantity,
      );
      wanted.set(item.inventory_item_id, byLocation);
    }
  }

  const plan: InventoryLevelsPlan = { create: [], update: [] };
  const itemIds = new Set(
    input.variants.flatMap((v) =>
      v.inventory_items.map((item) => item.inventory_item_id),
    ),
  );

  for (const itemId of itemIds) {
    const byLocation = wanted.get(itemId) ?? new Map<string, number>();
    const levels = input.levels.filter(
      (level) => level.inventory_item_id === itemId,
    );

    for (const [location_id, stocked_quantity] of byLocation) {
      const level = levels.find((l) => l.location_id === location_id);
      if (!level)
        plan.create.push({
          inventory_item_id: itemId,
          location_id,
          stocked_quantity,
        });
      else if (level.stocked_quantity !== stocked_quantity)
        plan.update.push({
          id: level.id,
          inventory_item_id: itemId,
          location_id,
          stocked_quantity,
        });
    }

    for (const level of levels) {
      if (
        supplierLocations.has(level.location_id) &&
        !byLocation.has(level.location_id) &&
        level.stocked_quantity !== 0
      )
        plan.update.push({
          id: level.id,
          inventory_item_id: itemId,
          location_id: level.location_id,
          stocked_quantity: 0,
        });
    }
  }

  return plan;
}
