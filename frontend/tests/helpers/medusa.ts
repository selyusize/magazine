import { getProducts } from "@shared/api";

let variantId: string | undefined;

/** id варианта товара из каталога Medusa (любого магазина: берётся первый доступный). */
export async function anyVariantId(): Promise<string> {
  if (variantId) return variantId;
  const { products } = await getProducts({ limit: 20, fields: "id,*variants" });
  const variant = products.flatMap((product) => product.variants ?? []).find(Boolean);
  if (!variant) throw new Error("В каталоге Medusa нет ни одного варианта товара — выполните сид (pnpm seed в backend)");
  variantId = variant.id;
  return variantId;
}

export async function variantIds(count: number): Promise<string[]> {
  const { products } = await getProducts({ limit: 20, fields: "id,*variants" });
  const ids = products.flatMap((product) => product.variants ?? []).map((variant) => variant.id);
  if (ids.length < count) throw new Error(`Нужно ${count} варианта(ов) товара, в каталоге ${ids.length}`);
  return ids.slice(0, count);
}

/** Уникальный email, чтобы тесты не зависели друг от друга и от прошлых прогонов. */
export function uniqueEmail(prefix = "test") {
  return `${prefix}+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}
