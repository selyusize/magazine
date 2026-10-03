import { planInventoryLevels } from "../inventory-levels";

const variant = (id: string, item = `iitem_${id}`, required_quantity = 1) => ({
  id,
  inventory_items: [{ inventory_item_id: item, required_quantity }],
});
const supplier = (id: string, is_selling = true) => ({
  id,
  stock_location_id: `sloc_${id}`,
  is_selling,
});

describe("planInventoryLevels", () => {
  it("создаёт уровни на складах поставщиков с суммой их предложений", () => {
    const plan = planInventoryLevels({
      variants: [variant("v1")],
      offers: [
        { variant_id: "v1", supplier_id: "a", quantity: 3 },
        { variant_id: "v1", supplier_id: "a", quantity: 2 },
        { variant_id: "v1", supplier_id: "b", quantity: 7 },
      ],
      suppliers: [supplier("a"), supplier("b")],
      levels: [],
    });

    expect(plan).toEqual({
      create: [
        {
          inventory_item_id: "iitem_v1",
          location_id: "sloc_a",
          stocked_quantity: 5,
        },
        {
          inventory_item_id: "iitem_v1",
          location_id: "sloc_b",
          stocked_quantity: 7,
        },
      ],
      update: [],
    });
  });

  it("меняет только расходящиеся уровни — повторный запуск пустой", () => {
    const input = {
      variants: [variant("v1")],
      offers: [
        { variant_id: "v1", supplier_id: "a", quantity: 4 },
        { variant_id: "v1", supplier_id: "b", quantity: 1 },
      ],
      suppliers: [supplier("a"), supplier("b")],
      levels: [
        {
          id: "l_a",
          inventory_item_id: "iitem_v1",
          location_id: "sloc_a",
          stocked_quantity: 4,
        },
        {
          id: "l_b",
          inventory_item_id: "iitem_v1",
          location_id: "sloc_b",
          stocked_quantity: 9,
        },
      ],
    };

    expect(planInventoryLevels(input)).toEqual({
      create: [],
      update: [
        {
          id: "l_b",
          inventory_item_id: "iitem_v1",
          location_id: "sloc_b",
          stocked_quantity: 1,
        },
      ],
    });
    input.levels[1].stocked_quantity = 1;
    expect(planInventoryLevels(input)).toEqual({ create: [], update: [] });
  });

  it("обнуляет склады выключенных, удалённых и оставшихся без предложений поставщиков, чужие склады не трогает", () => {
    const plan = planInventoryLevels({
      variants: [variant("v1")],
      offers: [{ variant_id: "v1", supplier_id: "off", quantity: 5 }],
      suppliers: [
        supplier("off", false),
        supplier("gone", false),
        supplier("empty"),
      ],
      levels: [
        {
          id: "l_off",
          inventory_item_id: "iitem_v1",
          location_id: "sloc_off",
          stocked_quantity: 5,
        },
        {
          id: "l_gone",
          inventory_item_id: "iitem_v1",
          location_id: "sloc_gone",
          stocked_quantity: 2,
        },
        {
          id: "l_empty",
          inventory_item_id: "iitem_v1",
          location_id: "sloc_empty",
          stocked_quantity: 0,
        },
        {
          id: "l_own",
          inventory_item_id: "iitem_v1",
          location_id: "sloc_warehouse",
          stocked_quantity: 8,
        },
      ],
    });

    expect(plan.create).toEqual([]);
    expect(
      plan.update.map((level) => [level.id, level.stocked_quantity]),
    ).toEqual([
      ["l_off", 0],
      ["l_gone", 0],
    ]);
  });

  it("набор: остаток умножается на required_quantity; поставщик без склада пропускается", () => {
    const plan = planInventoryLevels({
      variants: [variant("kit", "iitem_sock", 2)],
      offers: [
        { variant_id: "kit", supplier_id: "a", quantity: 5 },
        { variant_id: "kit", supplier_id: "nowhere", quantity: 5 },
      ],
      suppliers: [
        supplier("a"),
        { id: "nowhere", stock_location_id: null, is_selling: true },
      ],
      levels: [],
    });

    expect(plan.create).toEqual([
      {
        inventory_item_id: "iitem_sock",
        location_id: "sloc_a",
        stocked_quantity: 10,
      },
    ]);
  });
});
