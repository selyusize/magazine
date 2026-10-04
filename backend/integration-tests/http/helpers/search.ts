import type { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

import { waitFor } from "./auth";

/**
 * Индекс поиска `product`, построенный из БД: в тестовой БД его никто не создаёт (на dev его строит старт сервера),
 * поэтому тест мигрирует индекс и пересобирает его из текущих товаров — вызывать после их создания.
 */
export async function buildProductIndex(container: MedusaContainer): Promise<void> {
  const search = container.resolve(Modules.SEARCH);
  await search.executeIndexMigrationPlan(await search.createIndexMigrationPlan());
  await search.reindex({ index: "product" });
  await waitFor(async () => (await search.listIndexes()).find((index) => index.name === "product")?.status === "ready");
}
