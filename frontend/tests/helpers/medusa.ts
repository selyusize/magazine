import { getProducts } from "@shared/api";

/**
 * Запас варианта, с которым тесты могут спокойно менять количество в корзине.
 * Склад приходит из предложений поставщика (в демо-сиде — случайный), поэтому вариант
 * без запаса Medusa в корзину не пустит.
 */
const MIN_STOCK = 5;

let variantId: string | undefined;

/** id вариантов товаров с запасом не меньше MIN_STOCK (любого магазина: первые подходящие). */
async function stockedVariantIds(): Promise<string[]> {
  const { products } = await getProducts({ limit: 50, fields: "id,*variants,+variants.inventory_quantity" });
  return products
    .flatMap((product) => product.variants ?? [])
    .filter((variant) => (variant.inventoryQuantity ?? 0) >= MIN_STOCK)
    .map((variant) => variant.id);
}

/** id варианта товара из каталога Medusa с достаточным запасом. */
export async function anyVariantId(): Promise<string> {
  if (variantId) return variantId;
  const [id] = await stockedVariantIds();
  if (!id) throw new Error(`В каталоге Medusa нет вариантов с запасом от ${MIN_STOCK} шт. — выполните сид (pnpm seed в backend)`);
  variantId = id;
  return variantId;
}

export async function variantIds(count: number): Promise<string[]> {
  const ids = await stockedVariantIds();
  if (ids.length < count) throw new Error(`Нужно ${count} варианта(ов) товара с запасом от ${MIN_STOCK} шт., в каталоге ${ids.length}`);
  return ids.slice(0, count);
}

/** Уникальный email, чтобы тесты не зависели друг от друга и от прошлых прогонов. */
export function uniqueEmail(prefix = "test") {
  return `${prefix}+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}
