// Префикс «_»: загрузчик индексов Medusa импортирует каждый файл из src/search (и __tests__ тоже), кроме «_*».
import { resolveProductIds } from "../resolve-product-ids";

const contextWith = (rows: unknown[]) => {
  const graph = jest.fn().mockResolvedValue({ data: rows });
  const context = { container: { query: { graph, search: jest.fn() } } };

  return { graph, context };
};

describe("resolveProductIds", () => {
  it("событие товара отдаёт его id без запросов", async () => {
    const { graph, context } = contextWith([]);

    await expect(
      resolveProductIds({ name: "product.updated", data: [{ id: "prod_1" }] }, context),
    ).resolves.toEqual(["prod_1"]);
    expect(graph).not.toHaveBeenCalled();
  });

  it("общая опция ведёт ко всем своим товарам через products, без product_id", async () => {
    const { graph, context } = contextWith([
      { products: [{ id: "prod_1" }, { id: "prod_2" }] },
      { products: [{ id: "prod_2" }] },
    ]);

    await expect(
      resolveProductIds({ name: "product-option.created", data: { id: "opt_1" } }, context),
    ).resolves.toEqual(["prod_1", "prod_2"]);
    expect(graph).toHaveBeenCalledWith(
      expect.objectContaining({ entity: "product_option", fields: ["products.id"], withDeleted: false }),
    );
  });

  it("опция без товаров и пустые строки Query не роняют подписчика", async () => {
    const { context } = contextWith([undefined, null, { products: null }]);

    await expect(
      resolveProductIds({ name: "product-option.created", data: { id: "opt_1" } }, context),
    ).resolves.toEqual([]);
  });

  it("значение опции — через option.products, удалённое читается withDeleted", async () => {
    const { graph, context } = contextWith([
      { option: { products: [{ id: "prod_3" }] } },
    ]);

    await expect(
      resolveProductIds({ name: "product-option-value.deleted", data: [{ id: "optval_1" }] }, context),
    ).resolves.toEqual(["prod_3"]);
    expect(graph).toHaveBeenCalledWith(
      expect.objectContaining({ fields: ["option.products.id"], withDeleted: true }),
    );
  });

  it("неизвестная сущность — пусто", async () => {
    const { context } = contextWith([]);

    await expect(
      resolveProductIds({ name: "brand.updated", data: { id: "brand_1" } }, context),
    ).resolves.toEqual([]);
  });
});
